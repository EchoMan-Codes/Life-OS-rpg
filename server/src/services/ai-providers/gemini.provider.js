/**
 * Google Gemini Cloud AI Provider.
 *
 * Connects securely to Google's Gemini models when GEMINI_API_KEY is configured on the server.
 */
export class GeminiAiProvider {
  name = 'gemini';

  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async generateResponse({ message, userContext, history = [] }) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;

    const systemPrompt = `You are Jeevan AI, a personal Life Operating System assistant.
You help the user balance academic learning (StudySmart), physical and mental health (Wellness), financial discipline (Finance), execution (Goals & Planning), and RPG character progression (Rewards).
User Context:
${JSON.stringify(userContext, null, 2)}

Instructions:
- Be encouraging, concise, actionable, and structured.
- If the user reports an expense (e.g. "I spent ₹450 on dinner"), format your response and include an action suggestion.
- If the user reports studying (e.g. "I studied DBMS for 2 hours"), praise their effort and summarize the XP they will earn.`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser Message: ${message}` }],
      },
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return {
      content: replyText,
      actionType: null,
      actionPayload: null,
      actionStatus: null,
    };
  }
}
