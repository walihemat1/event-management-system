import mongoose from "mongoose";
import "dotenv/config";

import expressServer from "../server.js";

const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.LOCAL_MONGO_URI);
    console.log("DB connected...");
    expressServer.listen(PORT, () =>
      console.log(`App is running on port ${PORT}`)
    );
  } catch (error) {
    console.log("Error connecting DB: ", error);
    process.exit(1);
  }
};

export default connectDB;
