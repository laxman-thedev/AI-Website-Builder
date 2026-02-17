import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";

const app = express();

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(",") || [], // Allow requests from this origin
    credentials: true, // Allow cookies to be sent with requests
}

// Middleware
app.use(cors(corsOptions))

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});