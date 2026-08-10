import "dotenv/config";
import app from "./app";
import connectDB from "./db";
import { logMailerStatus } from "./services/mailer.service";

const port = Number(process.env.PORT) || 5001;

const startServer = async () => {
  try {
    await connectDB();
    logMailerStatus();

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
