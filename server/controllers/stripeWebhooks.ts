// Handles Stripe webhook events for credit purchases.
// Module: controllers.
import { Request, Response } from "express"
import Stripe from "stripe";
import prisma from "../lib/prisma.js";

export const stripeWebhook = async (request: Request, response: Response) => {
    // Stripe: initialize client and webhook secret.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    if (endpointSecret) {
        // Get the signature sent by Stripe
        const signature = request.headers['stripe-signature'] as string;

        let event;
        try {
            // Stripe: verify webhook signature and parse event.
            event = stripe.webhooks.constructEvent(
                request.body,
                signature,
                endpointSecret
            );
        } catch (err: any) {
            console.log(`⚠️ Webhook signature verification failed.`, err.message);
            return response.sendStatus(400);
        }

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                // Stripe: find checkout session tied to the payment intent.
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                });

                const session = sessionList.data[0];
                const {transactionId, appId} = session.metadata as {transactionId: string; appId: string};

                if(appId === 'ai-website-builder') {
                    // Prisma: mark the transaction as paid.
                    const transaction = await prisma.transaction.update({
                        where: {
                            id: transactionId
                        },
                        data: {
                            isPaid: true
                        }
                    });

                    // Prisma: add purchased credits to the user.
                    await prisma.user.update({
                        where: {
                            id: transaction.userId
                        }, 
                        data: {
                            credits: {increment: transaction.credits}
                        }

                    })
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        response.json({ received: true });
    }
};
