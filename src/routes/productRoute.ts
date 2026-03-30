import express from "express";
import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct } from "../controllers/productController"
import { authMiddleware } from "../middlewares/authMiddleware";
import authorize from "../middlewares/authorizationMiddleware";

const productRouter = express.Router();

productRouter.use(authMiddleware);

productRouter.get("/", authorize("admin","manager","cashier"), /* #swagger.tags = ['Products'] */ getAllProducts);
productRouter.get("/:id", authorize("admin","manager","cashier"), /* #swagger.tags = ['Products'] */ getProductById);
productRouter.post("/", authorize("admin","manager"), /* #swagger.tags = ['Products'] */ createProduct);
productRouter.patch("/:id", authorize("admin","manager"), /* #swagger.tags = ['Products'] */ updateProduct);
productRouter.delete("/:id", authorize("admin"), /* #swagger.tags = ['Products'] */ deleteProduct);

export default productRouter;