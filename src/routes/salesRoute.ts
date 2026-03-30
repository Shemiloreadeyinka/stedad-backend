import express from "express";
import { createSale, getAllSales, getSaleById, updateSale, deleteSale, getDailySales, getSaleReceipt, printSaleReceipt, getEndOfDaySales, searchSalesByCustomer } from "../controllers/salesController"
import { authMiddleware } from "../middlewares/authMiddleware";
import authorize from "../middlewares/authorizationMiddleware";
const salesRouter = express.Router();

salesRouter.use(authMiddleware);

salesRouter.get("/", authorize("admin","manager","cashier"), /* #swagger.tags = ['Sales'] */ getAllSales);
salesRouter.get("/search-customer", authorize("admin","manager","cashier"), /* #swagger.tags = ['Sales'] */ searchSalesByCustomer);
salesRouter.get("/eod", authorize("admin","manager"), /* #swagger.tags = ['Sales'] */ getEndOfDaySales);
salesRouter.get("/daily", authorize("admin","manager","cashier"), /* #swagger.tags = ['Sales'] */ getDailySales);
salesRouter.get("/:id/receipt", authorize("admin","manager","cashier"), /* #swagger.tags = ['Sales'] */ getSaleReceipt);
salesRouter.post("/:id/print", authorize("admin","manager","cashier"), /* #swagger.tags = ['Sales'] */ printSaleReceipt);
salesRouter.get("/:id", authorize("admin","manager","cashier"), /* #swagger.tags = ['Sales'] */ getSaleById);
salesRouter.post("/", authorize("admin","manager","cashier"), /* #swagger.tags = ['Sales'] */ createSale);
salesRouter.patch("/:id", authorize("admin","manager"), /* #swagger.tags = ['Sales'] */ updateSale);
salesRouter.delete("/:id", authorize("admin"), /* #swagger.tags = ['Sales'] */ deleteSale);

export default salesRouter;
