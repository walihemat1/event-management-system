import jwt from "jsonwebtoken";
import env from "dotenv";

env.config();

export const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "30d",
  });
  return token;
};
