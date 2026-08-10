import { Router } from "express";
import {
  chat,
  confirmAction,
  createSession,
  getSession,
  listSessions,
  removeSession,
} from "../controllers/assistant.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);
router.get("/sessions", listSessions);
router.post("/sessions", createSession);
router.get("/sessions/:sessionId", getSession);
router.delete("/sessions/:sessionId", removeSession);
router.post("/chat", chat);
router.post("/actions/confirm", confirmAction);
export default router;
