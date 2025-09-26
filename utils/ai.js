// utils/ai.js

require('dotenv').config();
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Simple mock fallback function
function mockParseMessage(message) {
  message = message.toLowerCase();
  if (message.includes("approve")) return { action: "approve_visitor", args: { name: message.split("approve visitor ")[1] || "unknown" } };
  if (message.includes("deny")) return { action: "deny_visitor", args: { name: message.split("deny visitor ")[1] || "unknown" } };
  if (message.includes("checkin")) return { action: "checkin_visitor", args: { name: message.split("checkin visitor ")[1] || "unknown" } };
  if (message.includes("guest pass")) return { action: "create_guest_pass", args: { name: message.split("guest pass ")[1] || "unknown" } };
  return { action: null, args: {} };
}

// Main function to parse message using OpenAI with fallback
async function parseActionFromMessage(message) {
  try {
    const prompt = `Extract one action and args from the user's message.
Allowed actions: approve_visitor, deny_visitor, checkin_visitor, create_guest_pass.
Respond with valid JSON: {"action": "<action|null>", "args": {...}}.`;

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: 'user', content: prompt + "\nUser: " + message }],
      max_tokens: 200
    });

    const raw = resp.choices?.[0]?.message?.content || '{}';
    try {
      return JSON.parse(raw);
    } catch {
      return mockParseMessage(message);
    }

  } catch (err) {
    console.error("OpenAI API Error (using mock fallback):", err.message);
    return mockParseMessage(message);
  }
}

module.exports = { parseActionFromMessage };
