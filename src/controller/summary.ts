import { Request, Response } from "express";
import { generateOrFetchSummary } from "../services/summary.service";
// import { generateOrFetchSummary } from "../services/summary.service";

export const getSummary = async (req: Request, res: Response) => {
  try {
    const { telegramGroupId, periodStart, periodEnd } = req.body;

    if (!telegramGroupId || !periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await generateOrFetchSummary({
      telegramGroupId,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
    });
    console.log(JSON.stringify(result));
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate summary",
    });
  }
};
