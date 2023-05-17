import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const { DB_URL } = process.env;
export const connectWithDB = () => {
  mongoose
    .connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("DB got Connected");
    })
    .catch((error) => {
      console.log("DB connection issue");
      console.log(error);
      process.exit(1);
    });
};
