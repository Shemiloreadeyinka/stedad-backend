import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import Staff from "../models/staffModel";

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { StaffId, password } = req.body;

        if (!StaffId || !password) {
            res.status(400).json({ message: "Please provide StaffId and password" });
            return;
        }

        const staff = await Staff.findOne({ StaffId });

        if (!staff) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        if (!staff.isActive) {
            res.status(403).json({ message: "Account is inactive. Please contact your admin." });
            return;
        }

        const isMatch = await bcrypt.compare(password, staff.password as string);

        if (!isMatch) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT secret not configured");
        }

        const token = jwt.sign(
            { id: staff._id, role: staff.role },
            process.env.JWT_SECRET,
            { expiresIn: "10h" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: staff._id,
                fullname: staff.fullname,
                StaffId: staff.StaffId,
                role: staff.role
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during login",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
    // For JWT, server-side logout is mostly informational unless using a blacklist.
    res.status(200).json({ message: "Logout successful" });
};
