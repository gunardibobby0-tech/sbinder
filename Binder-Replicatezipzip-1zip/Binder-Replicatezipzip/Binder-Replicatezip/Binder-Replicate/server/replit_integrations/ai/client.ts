export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

let cachedApiKey: string | null = null;
let cachedModels: Array<{ id: string; name: string }> | null = null;

async function getApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  // Check for OpenRouter API key
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('API key not configured. Set OPENROUTER_API_KEY environment variable.');
  }

  cachedApiKey = key;
  return cachedApiKey;
}

export async function fetchOpenRouterModels(): Promise<Array<{ id: string; name: string }>> {
  if (cachedModels) return cachedModels;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    const models = data.data || [];

    // Sort by cost (prompt + completion), then by name
    const sorted = models
      .map((model: OpenRouterModel) => ({
        id: model.id,
        name: model.name,
        cost: (parseFloat(model.pricing?.prompt || '0') + parseFloat(model.pricing?.completion || '0')),
      }))
      .sort((a: any, b: any) => a.cost - b.cost)
      .map(({ id, name }: any) => ({ id, name }));

    cachedModels = sorted;
    return sorted;
  } catch (error) {
    console.error('Error fetching OpenRouter models:', error);
    // Return fallback models
    return [
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (Recommended)' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4 Omni Mini' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    ];
  }
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string = 'meta-llama/llama-3.3-70b-instruct'
): Promise<string> {
  const apiKey = await getApiKey();

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://studiobinder.local',
        'X-Title': 'StudioBinder',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`OpenRouter API error: ${response.status}`, error);
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    console.log('OpenRouter full response:', JSON.stringify(data).substring(0, 500));
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenRouter response structure:', data);
      throw new Error('Invalid response structure from API');
    }
    const content = data.choices[0].message.content;
    console.log('Extracted content length:', content?.length || 0);
    return content;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
}

export async function extractScriptData(
  documentContent: string,
  model: string = 'meta-llama/llama-3.3-70b-instruct',
  dateRange?: { startDate: string; endDate: string },
  daysOfWeek?: string[]
): Promise<{
  scriptContent: string;
  cast: Array<{ name: string; role: string; roleType: "character" | "crew" }>;
  crew: Array<{ name: string; role: string; department?: string }>;
  schedule: Array<{ title: string; description: string; duration: number }>;
}> {
  const prompt = `Extract production data from this script as JSON only. No explanation, just JSON.

Script:
${documentContent.substring(0, 2000)}

Return only this JSON structure (no markdown, no text):
{"scriptContent":"","cast":[{"name":"character name","role":"description"}],"crew":[{"name":"job title","role":"description","department":"category"}],"schedule":[{"title":"day title","description":"what happens","duration":480}]}

Rules: extract character names from script to cast, suggest 5-8 crew job positions like Director/DP/Sound, use 480 minutes for typical 8-hour day.`;

  try {
    const response = await callOpenRouter([
      {
        role: 'user',
        content: prompt,
      },
    ], model);

    // Log response for debugging
    console.log('API Response length:', response?.length || 0);
    console.log('API Response preview:', response?.substring(0, 200) || 'empty');

    // Extract JSON from response (handle potential markdown formatting)
    const jsonMatch = response?.match(/\{[\s\S]*\}/);
    if (!jsonMatch || !jsonMatch[0]) {
      console.error('No JSON found in response. Full response:', response?.substring(0, 500) || 'empty');
      throw new Error(`No JSON found in response (length: ${response?.length || 0})`);
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('JSON string:', jsonMatch[0]?.substring(0, 500));
      throw new Error('Failed to parse JSON response from API');
    }
    
    // Validate structure
    if (!parsed.scriptContent) parsed.scriptContent = '';
    if (!Array.isArray(parsed.cast)) parsed.cast = [];
    if (!Array.isArray(parsed.crew)) parsed.crew = [];
    if (!Array.isArray(parsed.schedule)) parsed.schedule = [];
    
    return parsed;
  } catch (error) {
    console.error('Failed to extract script data:', error);
    if (error instanceof Error) {
      if (error.message.includes('API error')) {
        throw new Error('API service is currently unavailable. Please ensure your OpenRouter API key is valid and has credits.');
      }
      if (error.message.includes('API key not configured')) {
        throw new Error('OpenRouter API key is not set. Please configure it in your project settings.');
      }
    }
    throw new Error('Failed to extract data from document. Please check the document format and try again.');
  }
}

export async function generateScript(
  prompt: string,
  model: string = 'meta-llama/llama-3.3-70b-instruct',
  language: 'en' | 'id' = 'id'
): Promise<string> {
  const langInstruction = language === 'id' 
    ? 'Buat naskah dalam bahasa Indonesia.' 
    : 'Create the script in English.';

  const systemPrompt = `You are a professional screenwriter and scriptwriter with extensive experience in film and television. 
Create high-quality, production-ready scripts with proper formatting, engaging dialogue, and clear scene descriptions. 
${langInstruction}`;

  const response = await callOpenRouter([
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: prompt,
    },
  ], model);

  return response;
}
