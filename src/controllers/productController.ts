import Product, { Iproduct } from "../models/productModel";
import { Request, Response } from "express";


export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const products = await Product.find()
        res.status(200).json({ message: "Products retrieved successfully", products })
    } catch (error) {
        res.status(500).json({
            message: "Error getting products",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }

}
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const product = await Product.findById(id)
        if (!product) {
            res.status(404).json({ message: "Product not found" })
            return;
        }
        res.status(200).json({ message: "Product retrieved successfully", product })
    } catch (error) {
        res.status(500).json({
            message: "Error getting product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {

        const { name, price, quantityLeft } = req.body
        if (!name || price === undefined || quantityLeft === undefined) {
            res.status(400).json({ message: "Please provide all required fields: name, price, quantityLeft" })
            return;
        }
        if (typeof price !== "number" || !Number.isFinite(price) || price < 0) {
            res.status(400).json({ message: "Price must be a non-negative number" });
            return;
        }
        if (typeof quantityLeft !== "number" || !Number.isFinite(quantityLeft) || quantityLeft < 0) {
            res.status(400).json({ message: "quantityLeft must be a non-negative number" });
            return;
        }
        const productId = `PROD-${Date.now()}`
        const product = new Product({ productId, name, price, quantityLeft })
        await product.save()
        res.status(201).json({ message: "Product created successfully", product })
    } catch (error) {
        res.status(500).json({
            message: "Error creating product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const { name, price, quantityLeft } = req.body
        if ("productId" in req.body) {
            res.status(400).json({ message: "productId cannot be updated" });
            return;
        }
        if (price !== undefined && (typeof price !== "number" || !Number.isFinite(price) || price < 0)) {
            res.status(400).json({ message: "Price must be a non-negative number" });
            return;
        }
        if (quantityLeft !== undefined && (typeof quantityLeft !== "number" || !Number.isFinite(quantityLeft) || quantityLeft < 0)) {
            res.status(400).json({ message: "quantityLeft must be a non-negative number" });
            return;
        }
        const product = await Product.findById(id)
        if (!product) {
            res.status(404).json({ message: "Product not found" })
            return;
        }
        if (name) product.name = name
        if (price !== undefined && price !== null) product.price = price
        if (quantityLeft !== undefined && quantityLeft !== null) product.quantityLeft = quantityLeft
        await product.save()
        res.status(200).json({ message: "Product updated successfully", product })
    } catch (error) {
        res.status(500).json({
            message: "Error updating product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const product = await Product.findByIdAndDelete(id)
        if (!product) {
            res.status(404).json({ message: "Product not found" })
            return;
        }
        res.status(200).json({ message: "Product deleted successfully" })
    } catch (error) {
        res.status(500).json({
            message: "Error deleting product",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
