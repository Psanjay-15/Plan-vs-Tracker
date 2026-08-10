import { Router } from "express";
import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
} from "../controllers/plan.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.route("/").get(listPlans).post(createPlan);
router.route("/:planId").patch(updatePlan).delete(deletePlan);

export default router;
