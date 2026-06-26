import express from "express";
import cors from "cors";
import { getUsers } from "./utils/storage.js";
import webauthnRoutes from "./routes/webauthn.js";
const app = express();
const PORT = 3000;

// Allows the Vue frontend to call this backend during local development
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

// Allows the backend to read JSON request bodies
app.use(express.json());
app.use("/api/webauthn", webauthnRoutes);

// Simple test endpoint to check whether the backend is running
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "FreshFlow WebAuthn backend is running",
  });
});
app.get("/users-test", async (req, res) => {
  const users = await getUsers();
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`FreshFlow WebAuthn backend is running on http://localhost:${PORT}`);
});