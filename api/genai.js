import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GOOGLE_GENAI_API_KEY" });
    }

    const { action, payload } = req.body || {};
    if (!action) {
      return res.status(400).json({ error: "Missing action" });
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1) Refine task description
    if (action === "refineTaskDescription") {
      const prompt = payload?.prompt;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "payload.prompt is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Based on the GMYT PRRR-SMART-SKRC framework, refine the following task description into a professional corporate directive: "${prompt}". 
Return a structured breakdown with: 
- Problem Identification
- Root Cause & Consequences
- Risk
- Specific Goal
- Measurable Outcome
- Attainable Steps
- Relevance to Business
- Time Bound Deadline`,
      });

      return res.status(200).json({ text: response.text });
    }

    // 2) Daily motivation
    if (action === "getDailyMotivation") {
      const response = await ai.models.generateContent({
        model: "gemini-flash-lite-latest",
        contents:
          "Generate a short, powerful, 1-sentence motivational quote for a strategic leader in the fashion industry. Focus on excellence, precision, and the PRRR-SMART-SKRC framework mindset. Do not use quotation marks.",
      });

      return res.status(200).json({ text: response.text });
    }

    // 3) Generate schema JSON
    if (action === "generateTaskSchema") {
      const role = payload?.role;
      const objective = payload?.objective;

      if (!role || typeof role !== "string") {
        return res.status(400).json({ error: "payload.role is required" });
      }
      if (!objective || typeof objective !== "string") {
        return res.status(400).json({ error: "payload.objective is required" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Generate a high-level corporate task for a ${role} with the following core objective: "${objective}". Use the GMYT PRRR-SMART-SKRC framework.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              problem: {
                type: Type.OBJECT,
                properties: {
                  description: {
                    type: Type.STRING,
                    description: "Detailed identification of the core business problem",
                  },
                  rootCauseAndConsequences: {
                    type: Type.STRING,
                    description: "Underlying cause and the impact if ignored",
                  },
                  risk: {
                    type: Type.STRING,
                    description: "Potential operational or financial risk",
                  },
                },
                required: ["description", "rootCauseAndConsequences", "risk"],
              },
              smart: {
                type: Type.OBJECT,
                properties: {
                  specific: { type: Type.STRING },
                  measurable: { type: Type.STRING },
                  attainable: { type: Type.STRING },
                  relevance: { type: Type.STRING },
                  timeBound: { type: Type.STRING },
                },
                required: ["specific", "measurable", "attainable", "relevance", "timeBound"],
              },
            },
          },
        },
      });

      // response.text should already be JSON text
      return res.status(200).json({ text: response.text });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
