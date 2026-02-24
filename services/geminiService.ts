
import { GoogleGenAI, Type } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured. Please ensure GEMINI_API_KEY is set in the environment.");
  }
  return new GoogleGenAI({ apiKey });
};

export const refineTaskDescription = async (prompt: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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
    return response.text;
  } catch (error) {
    console.error("AI refinement failed:", error);
    return null;
  }
};

export const getDailyMotivation = async () => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: "Generate a short, powerful, 1-sentence motivational quote for a strategic leader in the fashion industry. Focus on excellence, precision, and the PRRR-SMART-SKRC framework mindset. Do not use quotation marks.",
    });
    return response.text;
  } catch (error) {
    console.error("Motivation fetch failed:", error);
    return "Precision in strategy is the path to excellence.";
  }
};

export const generateTaskSchema = async (role: string, objective: string) => {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate a comprehensive corporate task plan for a ${role} based on this specific objective: "${objective}". 
      If the objective is a broad role description, generate a specific daily task. 
      If the objective is already a specific task, expand it into the full PRRR-SMART-SKRC framework.
      
      Framework Guidelines:
      - PRRR: Problem, Root Cause, Risk.
      - SMART: Specific, Measurable, Attainable, Relevance, Time-Bound.
      - SKRC: Status, Key Result, Reflection, Challenges.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasksForToday: { type: Type.STRING, description: "The primary strategic task or objective for today" },
            problem: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING, description: "Detailed identification of the core business problem" },
                rootCauseAndConsequences: { type: Type.STRING, description: "Underlying cause and the impact if ignored" },
                risk: { type: Type.STRING, description: "Potential operational or financial risk" }
              },
              required: ["description", "rootCauseAndConsequences", "risk"]
            },
            smart: {
              type: Type.OBJECT,
              properties: {
                specific: { type: Type.STRING },
                measurable: { type: Type.STRING },
                attainable: { type: Type.STRING },
                relevance: { type: Type.STRING },
                timeBound: { type: Type.STRING }
              },
              required: ["specific", "measurable", "attainable", "relevance", "timeBound"]
            }
          }
        }
      }
    });
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Task generation failed:", error);
    return null;
  }
};
