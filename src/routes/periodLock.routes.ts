import { Router } from "express";
import {
  listPeriodLocks,
  lockPeriod,
} from "../controllers/periodLock.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/", listPeriodLocks);
router.post("/:month", lockPeriod);

export default router;
