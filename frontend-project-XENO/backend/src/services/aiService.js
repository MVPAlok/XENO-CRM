import { env } from '../config/env.js';
import { listEnrichedSegments } from './segmentService.js';

const fallbackCopilot = async (workspaceId, text) => {
  const segments = await listEnrichedSegments(workspaceId);
  const normalized = text.toLowerCase();
  const inactive = segments.find((segment) => segment.name === 'Inactive Customers') || segments[0];
  const vip = segments.find((segment) => segment.name === 'VIP Customers') || segments[0];
  const atRisk = segments.find((segment) => segment.name === 'At Risk Customers') || inactive;

  let segment = inactive;
  let channel = 'WhatsApp';
  let message = 'Hi {{firstName}}, we miss you. Use WELCOME20 for 20% off your next purchase. Offer expires in 7 days.';

  if (normalized.includes('vip') || normalized.includes('high') || normalized.includes('spend')) {
    segment = vip;
    message = 'Hi {{firstName}}, your VIP early-access sale is live. Use VIPSECRET for 15% off before it closes.';
  } else if (normalized.includes('risk') || normalized.includes('churn')) {
    segment = atRisk;
    channel = 'Email';
    message = 'Hi {{firstName}}, here is a personalized offer to help you pick up where you left off.';
  }

  const expectedRevenue = Math.round((segment.revenuePotential || 50000) * 0.65);
  const reply = `I recommend targeting ${segment.name} on ${channel}. The segment has ${segment.count} customers, ${segment.expectedConversion} expected conversion, and roughly ₹${expectedRevenue.toLocaleString('en-IN')} expected revenue. Suggested message: "${message}"`;

  return {
    text: reply,
    data: {
      segment: {
        id: segment.id,
        name: segment.name,
        count: segment.count,
      },
      channel,
      message,
      expectedRevenue,
      confidenceScore: segment.confidenceScore,
    },
    action: {
      label: 'Draft Campaign',
      prompt: `Create a ${channel} campaign for ${segment.name}: ${message}`,
    },
  };
};

const callOpenAI = async (workspaceContext, prompt) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.openAiModel,
      messages: [
        {
          role: 'system',
          content:
            'You are Xeno AI Copilot. Return concise marketing recommendations with segment, channel, message, expectedRevenue, and explanation.',
        },
        { role: 'user', content: `Workspace context: ${JSON.stringify(workspaceContext)}\nPrompt: ${prompt}` },
      ],
      temperature: 0.4,
    }),
  });
  if (!response.ok) throw new Error('OpenAI request failed');
  const data = await response.json();
  return data.choices?.[0]?.message?.content;
};

const callGemini = async (workspaceContext, prompt) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are Xeno AI Copilot. Recommend segment, channel, message, expected revenue, and reasoning.\nContext: ${JSON.stringify(
                workspaceContext
              )}\nPrompt: ${prompt}`,
            },
          ],
        },
      ],
    }),
  });
  if (!response.ok) throw new Error('Gemini request failed');
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text;
};

export const generateCopilotReply = async (workspaceId, text) => {
  const fallback = await fallbackCopilot(workspaceId, text);
  const context = {
    suggested: fallback.data,
  };

  try {
    if (env.openAiApiKey) {
      const modelText = await callOpenAI(context, text);
      if (modelText) return { ...fallback, text: modelText };
    }
    if (env.geminiApiKey) {
      const modelText = await callGemini(context, text);
      if (modelText) return { ...fallback, text: modelText };
    }
  } catch (error) {
    console.warn('AI provider unavailable, using fallback copilot:', error.message);
  }

  return fallback;
};
