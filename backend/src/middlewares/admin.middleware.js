// middlewares/admin.middleware.js
export const authorizeAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }
    next();
  } catch (err) {
    console.error("Error in authorizeAdmin middleware:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
