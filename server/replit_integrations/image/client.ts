import { storage } from "../../storage";

async function getOpenRouterApiKey(userId?: string): Promise<string | null> {
  // Try user specific token first
  if (userId) {
    const settings = await storage.getUserSettings(userId);
    if (settings?.openrouterToken) {
      return settings.openrouterToken;
    }
  }
  // Fallback to environment variable
  return process.env.OPENROUTER_API_KEY || null;
}

export async function generateImageOpenRouter(
  prompt: string,
  userId?: string
): Promise<string> {
  const apiKey = await getOpenRouterApiKey(userId);
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini", // GPT-4o-mini supports image gen on OpenRouter
      modalities: ["image", "text"],
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter image gen error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0];
  
  if (!imageUrl) {
    throw new Error("No image generated in response");
  }

  return imageUrl;
}

