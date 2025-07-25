import express from "express";
import dotenv from "dotenv";
import authRoutes from "./router/auth.router.js";
import { connectDB } from "./lib/db.js";
import cookieParser from "cookie-parser";

dotenv.config();

const port = process.env.PORT;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.listen(port, () => {
  console.log(`connected to server ${port}`);
  connectDB();
});
