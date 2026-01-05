import type { Express, Request, Response } from "express";
import { generateImageOpenRouter } from "./client";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      const userId = (req as any).user?.id;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const imageUrl = await generateImageOpenRouter(prompt, userId);

      res.json({
        url: imageUrl,
      });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ 
        error: "Failed to generate image",
        details: error.message 
      });
    }
  });
}

