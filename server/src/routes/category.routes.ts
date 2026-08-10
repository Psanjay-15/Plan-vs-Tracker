import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/category.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.route("/").get(listCategories).post(createCategory);
router.route("/:categoryId").patch(updateCategory).delete(deleteCategory);

export default router;
