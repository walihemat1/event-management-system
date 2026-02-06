import multer from "multer";

// Store in memory as buffer (not on disk)
const storage = multer.memoryStorage();

// File filter: only accepting images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed"));
  }
};

// Configure multer with error handling
const multerConfig = {
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1,
  },
};

// Configure multer
export const uploadProfilePic = multer(multerConfig).single("profilePic");

// Configure multer
export const uploadEventProfilePic = multer(multerConfig).single("eventPic");
