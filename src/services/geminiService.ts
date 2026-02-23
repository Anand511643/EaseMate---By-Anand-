import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const predictCost = async (serviceType: string, description: string, district: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert cost estimator for home services in Bihar, India. 
      Based on the following details, provide a realistic estimated cost range in Indian Rupees (₹).
      
      Service Type: ${serviceType}
      Location: ${district}, Bihar
      Problem Description: ${description}
      
      Consider current market rates in Tier-2/Tier-3 cities of Bihar like Patna, Purnia, etc.
      Provide the response in JSON format with the following structure:
      {
        "estimatedRange": "₹XXX - ₹YYY",
        "explanation": "Brief explanation of why this cost is estimated (e.g., parts, labor time).",
        "tips": "One or two tips for the customer to save money or prepare for the technician."
      }`,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Prediction Error:", error);
    return {
      estimatedRange: "Unable to estimate",
      explanation: "There was an error connecting to the AI estimator.",
      tips: "Try describing the problem in more detail."
    };
  }
};
