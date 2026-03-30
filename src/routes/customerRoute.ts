import express from "express";
import {getAllCustomers, searchCustomerSales,deleteCustomer,updateCustomer,createCustomer,getCustomerById} from "../controllers/customerController";
import { authMiddleware } from "../middlewares/authMiddleware";
import authorize from "../middlewares/authorizationMiddleware";
const customerRouter = express.Router();

customerRouter.use(authMiddleware);

customerRouter.get("/", authorize("admin","manager","cashier"), /* #swagger.tags = ['Customers'] */ getAllCustomers);
customerRouter.get("/:id", authorize("admin","manager","cashier"), /* #swagger.tags = ['Customers'] */ getCustomerById);
customerRouter.post("/", authorize("admin","manager"), /* #swagger.tags = ['Customers'] */ createCustomer);
customerRouter.patch("/:id", authorize("admin","manager"), /* #swagger.tags = ['Customers'] */ updateCustomer);
customerRouter.delete("/:id", authorize("admin"), /* #swagger.tags = ['Customers'] */ deleteCustomer);


export default customerRouter;