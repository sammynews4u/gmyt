type GeminiApiResponse = { text?: string; error?: string };

async function callGemini(action: string, payload?: any) {
  const res = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  const data: GeminiApiResponse = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data.text ?? "";
}

export const refineTaskDescription = async (prompt: string) => {
  try {
    const text = await callGemini("refineTaskDescription", { prompt });
    return text || null;
  } catch (error) {
    console.error("AI refinement failed:", error);
    return null;
  }
};

export const getDailyMotivation = async () => {
  try {
    const text = await callGemini("getDailyMotivation");
    return text || "Precision in strategy is the path to excellence.";
  } catch (error) {
    console.error("Motivation fetch failed:", error);
    return "Precision in strategy is the path to excellence.";
  }
};

export const generateTaskSchema = async (role: string, objective: string) => {
  try {
    const text = await callGemini("generateTaskSchema", { role, objective });
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Task generation failed:", error);
    return null;
  }
};
