// Handles user-related controller logic like credits and projects.
// Module: controllers.
import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import openai from '../configs/openai.js';
import Stripe from 'stripe';


// Return the current user's credit balance.
export const getUserCredits = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        // Ensure the request is authenticated.
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Prisma: fetch user credits by id.
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        res.json({ credits: user?.credits || 0 });

    } catch (error) {
        console.error('Error fetching user credits:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Create a new project and kick off AI generation.
export const createUserProject = async (req: Request, res: Response) => {
    const userId = req.userId;
    try {
        const { initial_prompt } = req.body;
        // Ensure the request is authenticated.
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Prisma: fetch the user for credit checks.
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        // Ensure the user has enough credits.
        if (user && user.credits < 5) {
            return res.status(403).json({ message: 'add credits to create a project' })
        }

        // Prisma: create a new website project record.
        const project = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
                initial_prompt,
                userId
            }
        })

        // Prisma: increment total project creations for the user.
        await prisma.user.update({
            where: { id: userId },
            data: { totalCreation: { increment: 1 }, },
        });

        // Prisma: store the initial prompt as conversation history.
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: initial_prompt,
                projectId: project.id,
            }
        })

        // Prisma: deduct credits for project creation.
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } },
        });

        res.json({ projectId: project.id });

        // OpenAI: enhance the project prompt for better output.
        const promptEnhanceResponse = await openai.chat.completions.create({
            model: 'stepfun/step-3.5-flash:free',
            messages: [
                {
                    role: 'system',
                    content: `
                            You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.
                                Enhance this prompt by:
                                1. Adding specific design details (layout, color scheme, typography)
                                2. Specifying key sections and features
                                3. Describing the user experience and interactions
                                4. Including modern web design best practices
                                5. Mentioning responsive design requirements
                                6. Adding any missing but important elements

                            Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max). `
                },
                {
                    role: 'user',
                    content: initial_prompt,
                }
            ]
        })

        const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

        // Prisma: save the enhanced prompt to conversation.
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I 've enhanced your prompt to: "${enhancedPrompt}"`,
                projectId: project.id,
            }
        })

        // Prisma: log that generation is starting.
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `Now generating your website...`,
                projectId: project.id,
            }
        })

        // OpenAI: generate the initial HTML for the project.
        const codeGenerationResponse = await openai.chat.completions.create({
            model: 'stepfun/step-3.5-flash:free',
            messages: [
                {
                    role: 'system',
                    content: `
                        You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhancedPrompt}"
                            CRITICAL REQUIREMENTS:
                                - You MUST output valid HTML ONLY. 
                                - Use Tailwind CSS for ALL styling
                                - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                                - Use Tailwind utility classes extensively for styling, animations, and responsiveness
                                - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
                                - Use modern, beautiful design with great UX using Tailwind classes
                                - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
                                - Use Tailwind animations and transitions (animate-*, transition-*)
                                - Include all necessary meta tags
                                - Use Google Fonts CDN if needed for custom fonts
                                - Use placeholder images from https://placehold.co/600x400
                                - Use Tailwind gradient classes for beautiful backgrounds
                                - Make sure all buttons, cards, and components use Tailwind styling

                            CRITICAL HARD RULES:
                                1. You MUST put ALL output ONLY into message.content.
                                2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
                                3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
                                4. Do NOT include markdown, explanations, notes, or code fences.

                            The HTML should be complete and ready to render as-is with Tailwind CSS.
                    `
                },
                {
                    role: 'user',
                    content: enhancedPrompt || '',
                }
            ]
        })

        const code = codeGenerationResponse.choices[0].message.content || '';

        if (!code) {
            // Prisma: record failure and refund credits.
            await prisma.conversation.create({
                data: {
                    role: 'assistant',
                    content: "Unable to generate code, please try again",
                    projectId: project.id
                }
            })
            // Prisma: refund credits on generation failure.
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            })
            return;
        }

        // Prisma: create the initial version record.
        const version = await prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                description: 'Initial version',
                projectId: project.id
            }
        })

        // Prisma: notify the user about the created website.
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've created your website! You can now preview it and request any changes.",
                projectId: project.id
            }
        })

        // Prisma: update project with the generated code.
        await prisma.websiteProject.update({
            where: { id: project.id },
            data: {
                current_code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                current_version_index: version.id
            }
        })

    } catch (error) {
        // Prisma: refund credits if any error occurs.
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: 5 } }
        })
        console.error('Error fetching user credits:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Fetch a single project with conversations and versions.
export const getUserProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        // Ensure the request is authenticated.
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        // Prisma: load project with conversations and versions.
        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId,
                userId
            },
            include: {
                conversation: {
                    orderBy: { timestamp: 'asc' }
                },
                versions: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        res.json({ project });

    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// List all projects for the current user.
export const getUserProjects = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        // Ensure the request is authenticated.
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Prisma: fetch all projects sorted by update time.
        const projects = await prisma.websiteProject.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });

        res.json({ projects });

    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Toggle a project's published state.
export const togglePublish = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;

        // Ensure the request is authenticated.
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;
        
        // Prisma: load the project for this user.
        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId,
                userId
            },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Prisma: flip the published flag.
        await prisma.websiteProject.update({
            where: {
                id: projectId,
            },
            data: {
                isPublished: !project.isPublished
            }
        });

        res.json({ message: project.isPublished ? 'Project unpublished' : 'Project published successfully' });
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a Stripe checkout session for credit purchase.
export const purchaseCredits = async (req: Request, res: Response) => {
    try {
        interface Plan {
            credits: number;
            amount: number;
        }

        const plans = {
            basic: { credits: 100, amount: 5 },
            pro: { credits: 400, amount: 19 },
            enterprise: { credits: 1000, amount: 49 }, 
        }

        const userId = req.userId;
        const {planId} = req.body as {planId: keyof typeof plans};
        const origin = req.headers.origin as string;

        const plan: Plan = plans[planId];

        // Validate the selected plan.
        if(!plan) {
            console.error('Invalid plan selected:', planId, plan);
            return res.status(400).json({message: 'Invalid plan selected'});
        }

        // Prisma: create a pending transaction record.
        const transaction = await prisma.transaction.create({
            data: {
                userId: userId!,
                planId: req.body.planId,
                amount: plan.amount,
                credits: plan.credits,
            }
        })

        // Stripe: initialize client with the secret key.
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

        // Stripe: create a checkout session for payment.
        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/loading`,
            cancel_url: `${origin}`,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `AISiteBuilder - ${plan.credits} credits`
                        },
                        unit_amount: Math.floor(transaction.amount) * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            metadata: {
                transactionId: transaction.id,
                appId: 'ai-website-builder',
            },
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
        })

        // Return Stripe checkout URL to the client.
        res.json({payment_url: session.url});
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
