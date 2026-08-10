import { Router } from "express";
import { chat, confirmAction } from "../controllers/assistant.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);
router.post("/chat", chat);
router.post("/actions/confirm", confirmAction);
export default router;
