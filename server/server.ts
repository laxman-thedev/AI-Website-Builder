// Starts the Express app and wires middleware/routes.
// Module: server bootstrap.
import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import { stripeWebhook } from "./controllers/stripeWebhooks.js";

const app = express();

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(",") || [], // Allow requests from this origin
    credentials: true, // Allow cookies to be sent with requests
}

// Apply CORS for trusted origins.
app.use(cors(corsOptions))

// POST /api/stripe: receive Stripe webhook events.
app.post('/api/stripe', express.raw({type: 'application/json'}), stripeWebhook)

// ALL /api/auth/*: forward auth requests to Better Auth handler.
app.all('/api/auth/{*any}', toNodeHandler(auth));

// Parse JSON request bodies for API routes.
app.use(express.json({limit: '50mb'})); 

const port = process.env.PORT || 3000;

// GET /: simple health check response.
app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

// Mount user-related API routes.
app.use('/api/user', userRouter);
// Mount project-related API routes.
app.use('/api/project', projectRouter);

// Start the HTTP server.
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
