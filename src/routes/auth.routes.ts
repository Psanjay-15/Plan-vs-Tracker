import { Router } from "express";
import {
  changePassword,
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
router.patch("/password", authenticate, changePassword);

export default router;
