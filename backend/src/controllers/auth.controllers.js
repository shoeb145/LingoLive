import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
export async function signup(req, res) {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      res.status(401).json({ message: "all field are required" });
    }
    if (password.length < 6) {
      res
        .status(400)
        .json({ message: "password must be at least 6 character" });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "invalid email format" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "user already exists" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; //generate number between 1 to 100

    const avatar = `https://avatar.iran.liara.run/public/${idx}`;

    const newUser = await User.create({
      fullName,
      email,
      password,
      profilePic: avatar,
    });

    try {
      upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log("new user created");
    } catch (error) {
      console.log(error);
    }
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: (process.env.NODE_ENV = "production"),
    });
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
}
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(401).json({ message: "all field are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "invalid email or user" });
    }
    console.log(typeof user.matchPassword);

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "invalid email or user" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: (process.env.NODE_ENV = "production"),
    });
    res.status(201).json({ success: true, user: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "internal server error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  return res
    .status(200)
    .json({ success: true, message: "logout successfuly " });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, learningLanguage, location } =
      req.body;

    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      res.status(401).json({
        message: "All fields is required",
        messingField: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(401).json({ message: "user not found" });
    }
    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.log(error);
  }
}
