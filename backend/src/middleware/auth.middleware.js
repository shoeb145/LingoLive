import jwt from "jsonwebtoken";
import User from "../models/User";

const protectRoute = (req, res, next) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ message: "unaotherized - no token " });
    }
  } catch (error) {}
};
