import { Router } from "express";
import {
  createActual,
  deleteActual,
  listActuals,
  updateActual,
} from "../controllers/actual.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.route("/").get(listActuals).post(createActual);
router.route("/:actualId").patch(updateActual).delete(deleteActual);

export default router;
