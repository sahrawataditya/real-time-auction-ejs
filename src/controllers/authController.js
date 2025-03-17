import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
// Login Controller
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // Validate credentials
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .render("auth/login", { error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Set token in cookie
    res.cookie("token", token, { httpOnly: true });

    // Redirect to home page
    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).render("auth/login", { error: "Something went wrong" });
  }
};

// Signup Controller
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res
        .status(400)
        .render("auth/signup", { error: "User already exists" });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in database
    await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    // Redirect to login page
    res.redirect("/auth/login");
  } catch (err) {
    console.error(err);
    res.status(500).render("auth/signup", { error: "Something went wrong" });
  }
};

// Logout Controller
const logout = (req, res) => {
  // Clear token cookie
  res.clearCookie("token");

  // Redirect to login page
  res.redirect("/auth/login");
};

export { login, signup, logout };
