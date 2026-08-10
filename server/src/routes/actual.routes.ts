import { Router } from "express";
import {
  createActual,
  deleteActual,
  exportActualsCsv,
  importActualsCsv,
  listActuals,
  updateActual,
} from "../controllers/actual.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);
router.route("/").get(listActuals).post(createActual);
router.get("/export", exportActualsCsv);
router.post("/import", importActualsCsv);
router.route("/:actualId").patch(updateActual).delete(deleteActual);

export default router;
