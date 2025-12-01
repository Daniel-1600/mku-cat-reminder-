import express from "express";
import cors from "cors";
import { config } from "dotenv";
import authRoutes from "./routes/auth.js";
import portalRoutes from "./routes/portal.js";
import catsRoutes from "./routes/cats.js";
import dashboardRoutes from "./routes/dashboard.js";

config();
const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/cats", catsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({ message: "CAT Reminder API is running" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
