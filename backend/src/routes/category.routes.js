import express from "express";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateUser, createCategory);
router.get("/", authenticateUser, getCategories);
router.patch("/:categoryId", authenticateUser, updateCategory);
router.delete("/:categoryId", authenticateUser, deleteCategory);

export default router;
