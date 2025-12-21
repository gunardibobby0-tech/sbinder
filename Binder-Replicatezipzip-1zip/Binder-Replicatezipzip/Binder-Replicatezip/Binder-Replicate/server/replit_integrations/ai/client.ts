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
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0].message.content;
}

export async function extractScriptData(
  documentContent: string,
  model: string = 'meta-llama/llama-3.3-70b-instruct',
  dateRange?: { startDate: string; endDate: string },
  daysOfWeek?: string[]
): Promise<{
  scriptContent: string;
  cast: Array<{ name: string; role: string; roleType: "character" | "crew" }>;
  crew: Array<{ name: string; role: string }>;
  schedule: Array<{ title: string; description: string; duration: number }>;
}> {
  const dateRangeInfo = dateRange ? `\nProduction Date Range: From ${dateRange.startDate} to ${dateRange.endDate}` : '';
  const daysInfo = daysOfWeek && daysOfWeek.length > 0 ? `\nProduction Days: ${daysOfWeek.join(', ')}` : '';
  
  const dateRangeInstruction = dateRange ? '\n5. Schedule all events within the provided date range' : '';
  const daysInstruction = daysOfWeek && daysOfWeek.length > 0 ? '\n6. Only schedule events on the specified production days (Monday-Sunday)' : '';
  
  const prompt = `You are a professional film and TV production expert. Your task is to analyze a screenplay, script, or production document and extract key production data.

DOCUMENT TO ANALYZE:
${documentContent}${dateRangeInfo}${daysInfo}

EXTRACTION INSTRUCTIONS:
1. Extract the main script content (narrative, dialogue, scene descriptions)
2. Extract cast data SEPARATELY:
   - Character names and roles (roleType: "character")
   - Required crew/producers (roleType: "crew")
3. Suggest additional crew positions for the production as master database suggestions
4. Extract production schedule events with realistic durations${dateRangeInstruction}${daysInstruction}

EXPECTED JSON RESPONSE FORMAT (MUST BE VALID JSON, NO MARKDOWN):
{
  "scriptContent": "The full screenplay or narrative content from the document. Include all dialogue, scene directions, and narrative text. If no script found, use a brief summary of the document.",
  "cast": [
    {
      "name": "Character name or Actor name",
      "role": "Character role (e.g., 'Lead', 'Detective', 'Female Lead') or Actor character"
    }
  ],
  "crew": [
    {
      "name": "Job title (e.g., 'Director', 'Cinematographer', 'Sound Mixer')",
      "role": "Description of responsibilities"
    }
  ],
  "schedule": [
    {
      "title": "Event or shooting day title (e.g., 'Day 1: Interior Scenes', 'Location Scout')",
      "description": "Brief description of what happens during this schedule item",
      "duration": 480
    }
  ]
}

IMPORTANT RULES:
- Return ONLY the JSON object, no additional text, markdown, or explanations
- Include both cast and crew in suggestions based on production type
- crew field should contain 3-6 essential crew positions based on the production needs
- All other fields are required. If information is not found, use appropriate defaults:
  - scriptContent: empty string ""
  - cast: empty array [] if no cast found
  - crew: array of 3-6 suggested crew positions (never empty if production type is clear)
  - schedule: empty array [] if no schedule found
- For cast, include complete names and clear role descriptions
- For crew, use actual job titles (Director, DP, Sound Mixer, etc.) not placeholder names
- Duration should be in minutes (480 = 8 hours for a typical shooting day)
- Ensure the JSON is valid and properly formatted
- Extract as much detail as possible from the provided document`;

  const response = await callOpenRouter([
    {
      role: 'user',
      content: prompt,
    },
  ], model);

  try {
    // Extract JSON from response (handle potential markdown formatting)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate structure
    if (!parsed.scriptContent) parsed.scriptContent = '';
    if (!Array.isArray(parsed.cast)) parsed.cast = [];
    if (!Array.isArray(parsed.crew)) parsed.crew = [];
    if (!Array.isArray(parsed.schedule)) parsed.schedule = [];
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse OpenRouter response:', response);
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
