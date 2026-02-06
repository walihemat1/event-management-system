// models/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const authProviderSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ["google"],
      required: true,
    },
    providerUserId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: "",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: [true, "Email is should be unique"],
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      // OAuth-only accounts may not have a password.
      required: false,
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

    // OAuth provider links
    authProviders: {
      type: [authProviderSchema],
      default: [],
    },

    // 🆕 activation flag
    isActive: {
      type: Boolean,
      default: true,
    },

    // optional metadata
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
  if (!this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// compare the user passwords
userSchema.methods.comparePasswords = async function (candidatePassword) {
  if (!candidatePassword) return false;
  if (!this.password) return false;

  const matchedPassword = await bcrypt.compare(
    candidatePassword,
    this.password
  );
  return matchedPassword;
};

// Prevent the same provider identity being linked to multiple users.
userSchema.index(
  { "authProviders.provider": 1, "authProviders.providerUserId": 1 },
  { unique: true, sparse: true }
);

const User = mongoose.model("User", userSchema);

export default User;
