// Handles project-related controller logic for revisions and publishing.
// Module: controllers.
import { Request, Response } from 'express'
import prisma from '../lib/prisma.js';
import openai from '../configs/openai.js';

// Create a new AI-powered revision for a project.
export const makeRevision = async (req: Request, res: Response) => {
    const userId = req.userId;
    try {
        // Read route params and prompt text.
        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;
        const { message } = req.body;

        // Prisma: fetch user for auth and credit checks.
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
        });

        // Ensure user is authenticated.
        if (!userId || !user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Ensure user has enough credits to proceed.
        if (user.credits < 5) {
            return res.status(403).json({ message: 'add more credits to make changes' })
        }

        // Ensure a valid prompt is provided.
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Please enter a valid prompt' })
        }

        // Prisma: load the current project and versions.
        const currentProject = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: { versions: true }
        })

        // Ensure project exists for this user.
        if (!currentProject) {
            return res.status(404).json({ message: 'Project not found' })
        }

        // Prisma: store user prompt in conversation history.
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: message,
                projectId
            }
        })

        // Prisma: decrement user credits for the request.
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        })

        // OpenAI: enhance the user prompt for clarity.
        const promptEnhanceResponse = await openai.chat.completions.create({
            model: 'stepfun/step-3.5-flash:free',
            messages: [
                {
                    role: 'system',
                    content: `
                        You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.
                        Enhance this by:
                            1. Being specific about what elements to change
                            2. Mentioning design details (colors, spacing, sizes)
                            3. Clarifying the desired outcome
                            4. Using clear technical terms

                        Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).
                    `
                },
                {
                    role: 'user',
                    content: `User's request: ${message}`
                }
            ]
        })

        const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;

        // Prisma: save enhanced prompt to conversation.
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I've enhanced your prompt to: ${enhancedPrompt}`,
                projectId
            }
        })

        // Prisma: log that generation is starting.
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `Now making changes to your website...: ${enhancedPrompt}`,
                projectId
            }
        })

        // OpenAI: generate updated HTML for the project.
        const codeGenerationResponse = await openai.chat.completions.create({
            model: 'stepfun/step-3.5-flash:free',
            messages: [
                {
                    role: 'system',
                    content: `
                        You are an expert web developer. 
                        CRITICAL REQUIREMENTS:
                            - Return ONLY the complete updated HTML code with the requested changes.
                            - Use Tailwind CSS for ALL styling (NO custom CSS).
                            - Use Tailwind utility classes for all styling changes.
                            - Include all JavaScript in <script> tags before closing </body>
                            - Make sure it's a complete, standalone HTML document with Tailwind CSS
                            - Return the HTML Code Only, nothing else
                    `
                },
                {
                    role: 'user',
                    content: `Here is the current website code: "${currentProject.current_code}" The user wants this change "${enhancedPrompt}"`
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
                    projectId
                }
            })
            // Prisma: refund credits when generation fails.
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            })
            return;
        }

        // Prisma: store the new version with generated code.
        const version = await prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                description: 'changes made',
                projectId
            }
        })

        // Prisma: notify user that changes were made.
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've made the changes to your website! You can now preview it",
                projectId
            }
        })

        // Prisma: update project with the latest code/version.
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                current_version_index: version.id
            }
        })

        res.json({ message: 'Changes made successfully' });

    } catch (error: any) {
        // Prisma: refund credits if an error occurs.
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { increment: 5 } }
        })
        console.error('Error fetching user credits:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Roll back a project to a specific saved version.
export const rollbackToVersion = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        const versionId = Array.isArray(req.params.versionId)
            ? req.params.versionId[0]
            : req.params.versionId;

        // Prisma: load project and versions for this user.
        const projects = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId },
            include: { versions: true }
        })

        if (!projects) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const version = projects.versions.find((v: any) => v.id === versionId);
        if (!version) {
            return res.status(404).json({ message: 'Version not found' });
        }

        // Prisma: update project to selected version code.
        await prisma.websiteProject.update({
            where: { id: projectId, userId },
            data: {
                current_code: version.code,
                current_version_index: version.id
            }
        })

        // Prisma: record rollback in conversation history.
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I've rolled back your website to selected version. You can now preview it.`,
                projectId
            }
        })

        res.json({ message: 'Rolled back to version successfully' });

    } catch (error: any) {
        console.error('Error rolling back to version:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Delete a project owned by the current user.
export const deleteProject = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        // Prisma: delete the project by id and user.
        await prisma.websiteProject.delete({
            where: { id: projectId, userId }
        })

        res.json({ message: 'Project deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Return project data for previewing in the UI.
export const getProjectPreview = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Prisma: fetch project with versions for preview.
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: { versions: true }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ message: 'Project preview retrieved successfully', project });
    } catch (error: any) {
        console.error('Error retrieving project preview:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// List all published projects for public viewing.
export const getPublishedProjects = async (req: Request, res: Response) => {
    try {
        // Prisma: list published projects with author names.
        const projects = await prisma.websiteProject.findMany({
            where: { isPublished: true },
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            }
        });

        res.json({ projects });
    } catch (error: any) {
        console.error('Error retrieving published projects:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Fetch public code for a single published project.
export const getProjectById = async (req: Request, res: Response) => {
    try {
        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;
        // Prisma: find a published project by id.
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId }
        })
        if (!project || project.isPublished === false || !project?.current_code) {
            return res.status(404).json({ message: 'Project not found' });
        }

        res.json({ code: project.current_code });
    } catch (error: any) {
        console.error('Error retrieving project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

// Save edited project code for the current user.
export const saveProjectCode = async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const projectId = Array.isArray(req.params.projectId)
            ? req.params.projectId[0]
            : req.params.projectId;
        const { code } = req.body;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!code || code.trim() === '') {
            return res.status(400).json({ message: 'Code cannot be empty' });
        }

        // Prisma: verify the project belongs to the user.
        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId }
        })

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Prisma: update the project with the new code.
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: code,
                current_version_index: ''
            }
        })

        res.json({ message: 'Project code saved successfully' });
    } catch (error: any) {
        console.error('Error retrieving project:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
} 
