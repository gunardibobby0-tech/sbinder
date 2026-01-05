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

// Helper function to determine if a model is premium/paid
function isPremiumModel(modelId: string): boolean {
  const premiumModelPatterns = [
    'gpt-4', 'gpt-4o', 'claude-3', 'claude-opus', 'gemini-2', 'mistral-large'
  ];
  return premiumModelPatterns.some(pattern => modelId.toLowerCase().includes(pattern));
}

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
        max_tokens: 1500,
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
  const isFreeTier = !isPremiumModel(model);
  
  const freePrompt = `Analyze the provided script and extract key production data into a strictly valid JSON format.

SCRIPT EXCERPT:
${documentContent.substring(0, 1800)}

Return ONLY a JSON object with this exact structure:
{
  "scriptContent": "1-sentence summary",
  "cast": [{"name": "Character Name", "role": "Character description"}],
  "crew": [{"name": "Job Title", "role": "Key responsibility", "department": "Dept"}],
  "schedule": [{"title": "Scene/Day Title", "description": "Action summary", "duration": 480}]
}

EXTRACTION RULES:
1. Extract main characters with character descriptions from the text.
2. Suggest 4-6 essential crew members (Director, Camera, Sound, Production).
3. Create a 2-3 day shooting schedule (480 mins/day).
4. OUTPUT ONLY RAW JSON. No markdown, no "json" code blocks, no preamble.
5. Ensure all quotes and brackets are properly balanced.`;

  const premiumPrompt = `You are an expert Production Manager. Perform a detailed script breakdown for the following script and generate a comprehensive production-ready JSON structure.

SCRIPT DATA:
${documentContent.substring(0, 3000)}

${dateRange ? `PLANNED PRODUCTION DATES: ${dateRange.startDate} to ${dateRange.endDate}` : ''}
${daysOfWeek && daysOfWeek.length > 0 ? `WORKING DAYS: ${daysOfWeek.join(', ')}` : ''}

REQUIRED JSON STRUCTURE:
{
  "scriptContent": "Professional summary (genre, tone, logline)",
  "cast": [
    {"name": "Character Name", "role": "Full personality/role profile"}
  ],
  "crew": [
    {"name": "Director", "role": "Vision & execution", "department": "Direction"},
    {"name": "DP", "role": "Visual language & lighting", "department": "Camera"},
    {"name": "Production Designer", "role": "Artistic world-building", "department": "Art"},
    {"name": "Sound Recordist", "role": "Field audio & dialogue capture", "department": "Sound"},
    {"name": "1st AD", "role": "Operations & safety", "department": "Production"},
    {"name": "Gaffer", "role": "Electrical & lighting", "department": "Camera/Grip"}
  ],
  "schedule": [
    {"title": "Day 1: [Key Scenes]", "description": "Detailed logistical plan for the day", "duration": 480}
  ]
}

DETAILED GUIDELINES:
- BREAKDOWN: Identify all speaking characters and their importance.
- CREW: Suggest 8-12 specialized crew roles based on the script's technical needs (e.g., if there's heavy makeup mentioned, add a MUA).
- LOGISTICS: Create a realistic shooting schedule spanning 4-7 days.
- FORMAT: RETURN ONLY VALID JSON. No markdown backticks. No conversational text.
- INTEGRITY: Ensure the JSON is syntactically perfect even if the content is long.`;

  const prompt = isFreeTier ? freePrompt : premiumPrompt;

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

    // Extract JSON from response (handle potential markdown formatting and truncation)
    let jsonStr = response?.trim() || '';
    
    // Remove markdown code blocks if present
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    jsonStr = jsonStr.replace(/^```\n?/, '').replace(/\n?```$/, '');
    
    // Try to find complete JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (!jsonMatch || !jsonMatch[0]) {
      console.error('No JSON found in response. Full response:', jsonStr?.substring(0, 500) || 'empty');
      throw new Error(`No JSON found in response (length: ${response?.length || 0})`);
    }

    let jsonToparse = jsonMatch[0];
    
    // Handle incomplete JSON (truncated response) by closing brackets
    try {
      JSON.parse(jsonToparse);
    } catch (e: any) {
      // If JSON is incomplete, try to fix by closing brackets
      if (e.message.includes('Unexpected end of JSON')) {
        console.log('Attempting to fix incomplete JSON...');
        // Close any unclosed arrays/objects
        let bracketCount = 0;
        let braceCount = 0;
        for (let i = 0; i < jsonToparse.length; i++) {
          if (jsonToparse[i] === '[') bracketCount++;
          if (jsonToparse[i] === ']') bracketCount--;
          if (jsonToparse[i] === '{') braceCount++;
          if (jsonToparse[i] === '}') braceCount--;
        }
        while (bracketCount > 0) { jsonToparse += ']'; bracketCount--; }
        while (braceCount > 0) { jsonToparse += '}'; braceCount--; }
        console.log('Fixed JSON length:', jsonToparse.length);
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonToparse);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('JSON string:', jsonToparse?.substring(0, 500));
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
  const isFreeTier = !isPremiumModel(model);
  const langInstruction = language === 'id' 
    ? 'Buat naskah dalam bahasa Indonesia.' 
    : 'Create the script in English.';

  let systemPrompt: string;
  
  if (isFreeTier) {
    systemPrompt = `You are a professional screenwriter and scriptwriter with extensive experience in film and television. 
Create high-quality, production-ready scripts with proper formatting, engaging dialogue, and clear scene descriptions. 
${langInstruction}`;
  } else {
    systemPrompt = `You are an award-winning screenwriter and script consultant with extensive credits in film, television, and streaming productions. 

Your expertise includes:
- Crafting compelling narratives with strong character arcs
- Writing production-ready scripts with proper industry formatting
- Creating authentic dialogue that reveals character and advances plot
- Structuring scenes for cinematic impact and practical filmmaking
- Adapting stories across genres while maintaining emotional resonance

Deliver scripts that are:
- Technically formatted to industry standards (proper scene headings, action lines, dialogue, parentheticals)
- Rich with visual storytelling and cinematic description
- Featuring nuanced, memorable dialogue
- Production-friendly with clear technical and logistical requirements
- Appropriate to budget scope while maximizing creative impact

${langInstruction}`;
  }

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
