
import { GoogleGenAI, Type } from "@google/genai";
import { FileCategory, CompressionStrategy } from "../types";

export async function getCompressionStrategy(
  category: FileCategory,
  originalSize: number,
  targetSize: number,
  iteration: number = 0,
  lastResultSize?: number
): Promise<CompressionStrategy> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    You are an expert compression systems architect.
    Analyze this compression request:
    - File Category: ${category}
    - Original Size: ${(originalSize / 1024).toFixed(2)} KB
    - Target Size: ${(targetSize / 1024).toFixed(2)} KB
    - Iteration: ${iteration}
    ${lastResultSize ? `- Previous Attempt Size: ${(lastResultSize / 1024).toFixed(2)} KB` : ''}

    Rules:
    1. If the previous attempt was too large, reduce quality and scale significantly.
    2. Suggest the optimal parameters (quality 0-1, scale 0-1) to reach the target size.
    3. Return a JSON object with quality, scale, bitrate, method, and reasoning.
    4. For IMAGES: quality affects JPEG/WebP quality, scale affects resolution.
    5. For TEXT: method should be 'GZIP' or 'Minification'.
    6. For PDF: focus on image downsampling and metadata removal.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quality: { 
            type: Type.NUMBER, 
            description: "Compression quality from 0.05 to 1.0" 
          },
          scale: { 
            type: Type.NUMBER, 
            description: "Resolution scaling factor from 0.1 to 1.0" 
          },
          bitrate: { 
            type: Type.NUMBER, 
            description: "Target bitrate in kbps" 
          },
          method: { 
            type: Type.STRING, 
            description: "The name of the algorithm" 
          },
          reasoning: { 
            type: Type.STRING, 
            description: "Brief reasoning for these parameters" 
          }
        },
        required: ["quality", "method", "reasoning"]
      }
    }
  });

  try {
    const strategy = JSON.parse(response.text || '{}');
    return {
      quality: Math.max(0.05, Math.min(1.0, strategy.quality ?? 0.8)),
      scale: Math.max(0.1, Math.min(1.0, strategy.scale ?? 1.0)),
      bitrate: strategy.bitrate,
      method: strategy.method || "Standard",
      reasoning: strategy.reasoning || "Optimizing for target size."
    };
  } catch (e) {
    return {
      quality: 0.5,
      scale: 0.7,
      method: "Safety Fallback",
      reasoning: "AI response parsing failed, using conservative defaults."
    };
  }
}
