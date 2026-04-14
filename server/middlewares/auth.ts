// Validates the current user session for protected routes.
// Module: middleware.
import { NextFunction, Request, Response } from 'express';
import { auth } from '../lib/auth.js';
import { fromNodeHeaders } from 'better-auth/node';

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Read session info using auth headers from the request.
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        })

        // Reject requests without a valid user session.
        if (!session || !session?.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Attach user id to the request for downstream handlers.
        req.userId = session.user.id;
        next(); 
    } catch (error: any) {
        console.log(error);
        res.status(401).json({message: error.code || error.message})
    }
}
