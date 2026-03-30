import Staff, { Istaff } from "../models/staffModel";
import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Sale from "../models/salesModel";
import bcrypt from "bcrypt";

export const getAllStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const staff = await Staff.find()
        res.status(200).json({ message: "Staff retrieved successfully", staff })
    } catch (error) {
        res.status(500).json({ message: "Error retrieving staff", error })
    }
}

export const getStaffById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        if (!id || !isValidObjectId(id)) {
            res.status(400).json({ message: "Please provide a valid staff ID" })
            return;
        }
        const staff = await Staff.findById(id)
        if (!staff) {
            res.status(404).json({ message: "Staff not found" });
            return;
        }
        res.status(200).json({ message: "Staff successfully retrieved", staff })
    } catch (error) {
        res.status(500).json({ message: "Error retrieving staff", error })
    }
}

export const createStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { fullname, pfp, password, isActive, role, guarantor } = req.body
        if (!fullname || !password || isActive === undefined || !role) {
            res.status(400).json({ message: "Please provide all required fields: fullname, password, isActive, role" })
            return;
        }
        if (typeof password !== "string") {
            res.status(400).json({ message: "password must be a string" })
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 12);

        // Retry a few times in case of duplicate key collisions under concurrent requests.
        for (let attempt = 0; attempt < 5; attempt++) {
            const StaffId = `STF-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;
            const staff = new Staff({ fullname, StaffId, pfp, password: hashedPassword, isActive, role, guarantor });
            try {
                await staff.save();
                res.status(201).json({ message: "Staff created successfully" });
                return;
            } catch (saveError: any) {
                if (saveError?.code === 11000 && saveError?.keyPattern?.StaffId) {
                    continue;
                }
                throw saveError;
            }
        }

        res.status(503).json({ message: "Could not allocate StaffId, please retry" })
    } catch (error) {
        res.status(500).json({ message: "Error creating staff", error })
    }

}

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        if (!id || !isValidObjectId(id)) {
            res.status(400).json({ message: "Please provide a valid staff ID" })
            return;
        }
        const updatePayload = { ...req.body } as Record<string, any>;
        delete updatePayload.StaffId;

        if (typeof updatePayload.password === "string" && updatePayload.password.length > 0) {
            updatePayload.password = await bcrypt.hash(updatePayload.password, 12);
        }

        const staff = await Staff.findByIdAndUpdate(
            id,
            updatePayload,
            { new: true }
        )
        if (!staff) {
            res.status(404).json({ message: "Staff not found" })
            return;
        }
        res.status(200).json({
            message: "Staff updated successfully",
            staff,
        });
    } catch (error) {
        res.status(500).json({ message: "Error updating staff", error })
    }
}

export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        if (!id || !isValidObjectId(id)) {
            res.status(400).json({ message: "Please provide a valid staff ID" })
            return;
        }
        const staff = await Staff.findByIdAndDelete(id)
        if (!staff) {
            res.status(404).json({ message: "Staff not found" })
            return;
        }
        res.status(200).json({ message: "Staff deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "Error deleting staff", error })
    }
}

export const searchStaff = async (req: Request, res: Response) => {
    try {
        const { search } = req.query
        if (typeof search !== 'string' || !search) {
            return res.status(400).json({ message: "Invalid search query" })
        }
        const filter: QueryFilter<Istaff> = ({
            $or: [
                { fullname: { $regex: search, $options: "i" } as any },
                { StaffId: { $regex: search, $options: "i" } as any },
            ]
        })
        const staff = await Staff.find(filter);

        return res.status(200).json({ message: "Staff searched successfully", staff })
    } catch (error) {
        return res.status(500).json({ message: "Error searching staff", error })
    }
}

export const searchStaffSales = async (req: Request, res: Response) => {
    try {
        const { search } = req.query
        if (typeof search !== 'string' || !search) {
            return res.status(400).json({ message: "Invalid search query" })
        }
        const filter: QueryFilter<Istaff> = ({
            $or: [
                { fullname: { $regex: search, $options: "i" } as any },
                { StaffId: { $regex: search, $options: "i" } as any },
            ]
        })
        const staff = await Staff.findOne(filter);

        if (!staff) {
            return res.status(404).json({ message: "Staff not found" })
        }

        const staffSales = await Sale.countDocuments({ staffId: staff._id });
        return res.status(200).json({
            message: "Staff sales count retrieved successfully",
            staff: {
                id: staff._id,
                fullname: staff.fullname,
                StaffId: staff.StaffId,
            },
            staffSales,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error retrieving staff sales count",
            error,
        });
    }
};
