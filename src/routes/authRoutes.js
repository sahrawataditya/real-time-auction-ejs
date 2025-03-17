import express from "express";
import { login, signup, logout } from "../controllers/authController.js";
import noAuthMiddleware from "../middleware/noAuthMiddleware.js";

const router = express.Router();

// Login Page
router.get("/login", noAuthMiddleware, (req, res) => {
  res.render("auth/login");
});

// Login Form Submission
router.post("/login", login);

// Signup Page
router.get("/signup", noAuthMiddleware, (req, res) => {
  res.render("auth/signup");
});

// Signup Form Submission
router.post("/signup", signup);

// Logout
router.get("/logout", logout);

export default router;
