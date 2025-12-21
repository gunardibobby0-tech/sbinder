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
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid OpenRouter response structure:', data);
      throw new Error('Invalid response structure from API');
    }
    return data.choices[0].message.content;
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
  const dateRangeInfo = dateRange ? `\nProduction Date Range: MUST be between ${dateRange.startDate} and ${dateRange.endDate} (INCLUSIVE)` : '';
  const daysInfo = daysOfWeek && daysOfWeek.length > 0 ? `\nProduction Days (STRICT): ${daysOfWeek.join(', ')} ONLY. Do not use other days.` : '';
  
  const dateRangeInstruction = dateRange ? `\n5. CRITICAL: ALL schedule events MUST be within the date range ${dateRange.startDate} to ${dateRange.endDate}. DO NOT generate dates outside this range.` : '';
  const daysInstruction = daysOfWeek && daysOfWeek.length > 0 ? `\n6. CRITICAL: Schedule events ONLY on these specific days: ${daysOfWeek.join(", ")}. Do NOT use any other days of the week.` : '';
  
  const prompt = `You are a professional film and TV production expert. Your task is to analyze a screenplay, script, or production document and extract key production data.

DOCUMENT TO ANALYZE:
${documentContent}${dateRangeInfo}${daysInfo}

EXTRACTION INSTRUCTIONS:
1. Extract the main script content (narrative, dialogue, scene descriptions)
2. Extract CHARACTER CAST ONLY - character names that appear in the script
3. Suggest CREW POSITIONS as production roles needed (not actual people - these become master data templates)
   - Include the department/discipline for each crew position
   - Map positions to standard departments: Direction, Camera, Lighting, Sound, Production, Grip, Art, Makeup, VFX, etc.
4. Extract production schedule events with realistic durations${dateRangeInstruction}${daysInstruction}

EXPECTED JSON RESPONSE FORMAT (MUST BE VALID JSON, NO MARKDOWN):
{
  "scriptContent": "The full screenplay or narrative content from the document. Include all dialogue, scene directions, and narrative text. If no script found, use a brief summary of the document.",
  "cast": [
    {
      "name": "Character name ONLY (e.g., 'John', 'Detective Sarah', 'The Villain')",
      "role": "Brief character description or type (e.g., 'Lead', 'Detective', 'Victim', 'Narrator')"
    }
  ],
  "crew": [
    {
      "name": "Job title (e.g., 'Director', 'Cinematographer', 'Sound Mixer', 'Gaffer')",
      "role": "Key responsibilities (e.g., 'Direct actors and oversee creative vision' or 'Manage camera work and cinematography')",
      "department": "Department category (e.g., 'Direction', 'Camera', 'Sound', 'Lighting', 'Production', 'Art')"
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
- CAST = Character names from script (what to film), will be created as cast entries with roleType "character"
- CREW = Job positions needed (Director, DP, etc.), will be stored as crew master templates for talent assignment
- crew field should contain 3-8 essential crew positions based on the production needs (never empty)
- All other fields are required. If information is not found, use appropriate defaults:
  - scriptContent: empty string ""
  - cast: array of character names extracted from script
  - crew: array of 3-8 suggested crew positions (never empty if production type is clear)
  - schedule: empty array [] if no schedule found
- For cast, use ONLY character names from the script, not actor names
- For crew, use actual job titles (Director, Cinematographer, Sound Mixer, Gaffer, etc.)
- Duration should be in minutes (480 = 8 hours for a typical shooting day)
- Ensure the JSON is valid and properly formatted
- Extract as much detail as possible from the provided document`;

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
