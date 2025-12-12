// models/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: [true, "Email is should be unique"],
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    fullName: {
      type: String,
      default: "",
    },
    username: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["attendee", "organizer", "admin"],
      default: "attendee",
    },

    // 🆕 activation flag
    isActive: {
      type: Boolean,
      default: true,
    },

    // optional metadata (nice but not required)
    deactivatedAt: {
      type: Date,
    },
    deactivatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// hash the user password before saving to the database
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// compare the user passwords
userSchema.methods.comparePasswords = async function (candidatePassword) {
  if (!candidatePassword) return false;

  const matchedPassword = await bcrypt.compare(
    candidatePassword,
    this.password
  );
  return matchedPassword;
};

const User = mongoose.model("User", userSchema);

export default User;
