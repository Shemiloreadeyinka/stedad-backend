import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthUser {
    id: string;
    role?: string;
}

declare module "express-serve-static-core" {
    interface Request {
        user?: AuthUser;
    }
}

interface TokenPayload extends JwtPayload {
    id: string;
    role?: string;
}

export const authMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    // We use a constant here so swagger-autogen doesn't auto-detect this as a parameter
    const AUTH_KEY = "authorization";
    const authHeader = req.headers[AUTH_KEY];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.warn("Auth Middleware: Missing or malformed Authorization header");
        return res.status(401).json({ message: "Unauthorized: Missing or malformed token" });
    }

    const token = authHeader.split(" ")[1];

    try {
        if (!process.env.JWT_SECRET) {
            console.error("Auth Middleware: JWT_SECRET is not defined in environment");
            throw new Error("JWT secret not configured");
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        ) as TokenPayload;

        req.user = {
            id: decoded.id,
            role: decoded.role,
        };

        next();
    } catch (error) {
        console.error("Auth Middleware: JWT Verification failed:", error instanceof Error ? error.message : error);
        return res.status(401).json({ message: "Invalid token" });
    }
};
