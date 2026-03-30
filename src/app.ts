// app.ts
import express from "express";
import cors from "cors";
import connectDB from "./config/dbConfig";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../docs/swagger.json";
dotenv.config();
import staffRoutes from "./routes/staffRoute";
import authRoutes from "./routes/authRoute";
import productRoutes from "./routes/productRoute";
import salesRoutes from "./routes/salesRoute";
import customerRoutes from "./routes/customerRoute";
const app = express();
connectDB();
app.use(cors({
    origin: [
      "http://localhost:3000",
      "https://stedad-frontend.vercel.app"
    ],
     methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/staff", staffRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);


export default app;
