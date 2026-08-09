import dotenv from "dotenv";
import app from "./app";
import connectDB from "./db";

dotenv.config();

const port = Number(process.env.PORT) || 5001;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      "Server startup failed:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
};

void startServer();
