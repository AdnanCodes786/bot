import { Router } from "express";
import { getSummary } from "../controller/summary";

const router = Router();

router.post("/generateSummary", getSummary);

export default router;
