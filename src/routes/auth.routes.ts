import { Router } from "express";
import {
  getCurrentUser,
  login,
  logout,
  signup,
  updatePreferences,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticate, getCurrentUser);
router.patch("/preferences", authenticate, updatePreferences);

export default router;
