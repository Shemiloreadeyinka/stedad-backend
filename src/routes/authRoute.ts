import express from "express";
import { login, logout } from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const authRouter = express.Router();

authRouter.post("/login", /* #swagger.tags = ['Authentication'] */ login);
authRouter.post("/logout", authMiddleware, /* #swagger.tags = ['Authentication'] */ logout);

export default authRouter;
