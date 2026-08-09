import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Plan vs Actual Tracker API is running",
  });
});

export default app;
