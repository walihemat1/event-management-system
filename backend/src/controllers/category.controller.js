import Category from "../models/categoryModel.js";
import { checkUserRole } from "../utils/user.js";

export const createCategory = async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "name and slug are required",
      });
    }

    await checkUserRole(res, "admin", req.user._id);

    const exists = await Category.findOne({ name });
    if (exists)
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.log("Error in createCategory:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "All categories",
      data: categories,
    });
  } catch (error) {
    console.log("Error in getCategories:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const updateCategory = async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId)
    return res.status(400).json({
      success: false,
      message: "Category ID is required",
    });

  try {
    await checkUserRole(res, "admin", req.user._id);

    const updated = await Category.findByIdAndUpdate(categoryId, req.body, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updated,
    });
  } catch (error) {
    console.log("Error in updateCategory:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.params;

  if (!categoryId)
    return res.status(400).json({
      success: false,
      message: "Category ID is required",
    });

  try {
    await checkUserRole(res, "admin", req.user._id);

    const deleted = await Category.findByIdAndDelete(categoryId);

    if (!deleted)
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteCategory:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
