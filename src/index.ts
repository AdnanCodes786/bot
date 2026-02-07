import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { connectDB } from "./db/connect";
connectDB();
const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running 🚀",
  });
});

app.post("/message", (req, res) => {
  console.log("📩 Telegram update received");
  console.log(JSON.stringify(req.body, null, 2));

  res.status(200).json({
    success: true,
    // data: req.body,
    message: "Route for receiving telegram message",
  });
});

async function start() {
   

  app.listen(PORT, () => {
    console.log("Backend is running now");
  });
}

start();
