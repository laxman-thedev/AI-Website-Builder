// Adds custom fields to Express request typing.
// Module: types.
import { Request } from "express";

declare global {
    namespace Express {
        // Include userId set by auth middleware.
        interface Request {
            userId?: string;
        }
    }
}
