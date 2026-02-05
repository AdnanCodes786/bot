import express from "express";
import { connectDB } from "./db/connect";
import { registerWebhook } from "./utils/webhook-setup";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Backend is running 🚀",
  });
});

app.listen(3000 , ()=>{
  console.log("backned is running now")
})
