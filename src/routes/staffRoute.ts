import express from "express";
import { getAllStaff, getStaffById, createStaff, updateStaff, deleteStaff, searchStaff, searchStaffSales } from "../controllers/staffController"
import { authMiddleware } from "../middlewares/authMiddleware";
import authorize from "../middlewares/authorizationMiddleware";
const staffRouter = express.Router();

staffRouter.use(authMiddleware);

staffRouter.get("/", authorize("admin","manager","cashier"), /* #swagger.tags = ['Staff'] */ getAllStaff);
staffRouter.get("/search", authorize("admin","manager","cashier"), /* #swagger.tags = ['Staff'] */ searchStaff);
staffRouter.get("/search-sales", authorize("admin","manager","cashier"), /* #swagger.tags = ['Staff'] */ searchStaffSales);
staffRouter.get("/:id", authorize("admin","manager","cashier"), /* #swagger.tags = ['Staff'] */ getStaffById);
staffRouter.post("/", authorize("admin","manager"), /* #swagger.tags = ['Staff'] */ createStaff);
staffRouter.patch("/:id", authorize("admin","manager"), /* #swagger.tags = ['Staff'] */ updateStaff);
staffRouter.delete("/:id", authorize("admin"), /* #swagger.tags = ['Staff'] */ deleteStaff);

export default staffRouter;
