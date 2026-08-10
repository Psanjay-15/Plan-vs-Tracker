import { Router } from "express";
import { getPlanVsActualReport } from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.get("/plan-vs-actual", getPlanVsActualReport);

export default router;
