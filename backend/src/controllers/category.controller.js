import Category from "../models/categoryModel.js";
import User from "../models/userModel.js";
import { checkUserRole } from "../utils/user.js";

export const createCategory = async (req, res) => {
  const { name, slug } = req.body;

  if (!name || !slug)
    return res.status(400).json({
      success: false,
      message: "name and slug are required",
    });

  try {
    // check if category creator is admin
    await checkUserRole(res, "admin", req.user._id);

    const categoryExits = await Category.findOne({ name });
    if (categoryExits)
      return res.status(400).json({
        success: false,
        message: "Category already exits",
      });

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      message: "Created added successfully",
      data: category,
    });
  } catch (error) {
    console.log("Error in createCategory controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({
      success: true,
      message: "All categories",
      data: categories,
    });
  } catch (error) {
    console.log("Error in getCategories controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
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
    // check if user is admin
    await checkUserRole(res, "admin", req.user._id);

    const updateCategory = await Category.findByIdAndUpdate(
      categoryId,
      req.body,
      { new: true }
    );

    if (!updateCategory)
      return res.status(404).json({
        success: false,
        message: "Category was not found",
      });

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updateCategory,
    });
  } catch (error) {
    console.log("Error in updateCategory controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const deleteCategory = async (req, res) => {
  const { categoryId } = req.categoryId;

  if (!categoryId)
    return res.status(400).json({
      success: false,
      message: "Category ID is required",
    });

  try {
    // check if user is admin
    await checkUserRole(res, "admin", req.user._id);

    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    if (!deleteCategory)
      return res.status(404).json({
        success: false,
        message: "Category was not found",
      });

    res.status(200).json({
      success: true,
      message: "Category was successfully deleted",
    });
  } catch (error) {
    console.log("Error in deleteCategory controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
