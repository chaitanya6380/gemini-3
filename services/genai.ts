import { GoogleGenAI, Schema } from "@google/genai";
import { AppMode, Attachment, GenerationSettings } from "../types";

// Helper to ensure paid key selection for Veo/Pro models
const ensurePaidKey = async (): Promise<void> => {
  if (window.aistudio) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await window.aistudio.openSelectKey();
    }
  }
};

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateResponse = async (
  mode: AppMode,
  prompt: string,
  attachment: Attachment | null,
  settings: GenerationSettings
): Promise<{ text?: string; mediaUrl?: string; mediaType?: 'image' | 'video' }> => {
  const ai = getClient();

  // --- 1. Video Generation (Veo) ---
  if (mode === AppMode.VideoGen) {
    await ensurePaidKey();
    
    // Create a fresh client after key selection to ensure it picks up the injected key
    const freshAi = getClient(); 
    
    const config: any = {
      numberOfVideos: 1,
      resolution: '1080p', // Defaulting to 1080p for quality
      aspectRatio: settings.aspectRatio === '9:16' ? '9:16' : '16:9' // Veo strict aspect ratios
    };

    // Construct request
    const requestParams: any = {
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: config
    };

    if (attachment) {
      requestParams.image = {
        imageBytes: attachment.base64,
        mimeType: attachment.mimeType
      };
    }

    let operation = await freshAi.models.generateVideos(requestParams);

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s polling
      operation = await freshAi.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed or returned no URI");

    // Append key for download
    const finalUrl = `${videoUri}&key=${process.env.API_KEY}`;
    return { mediaUrl: finalUrl, mediaType: 'video' };
  }

  // --- 2. Image Generation (Gemini 3 Pro Image) ---
  if (mode === AppMode.ImageGen) {
    await ensurePaidKey();
    const freshAi = getClient();

    const response = await freshAi.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: settings.aspectRatio, // 1:1, 16:9, etc.
          imageSize: settings.imageSize // 1K, 2K, 4K
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return {
          mediaUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          mediaType: 'image',
          text: "Generated with Gemini 3 Pro Image"
        };
      }
    }
    throw new Error("No image generated");
  }

  // --- 3. Image Editing (Gemini 2.5 Flash Image) ---
  if (mode === AppMode.ImageEdit) {
    // Nano Banana doesn't strictly need paid key check usually, but good practice if mixed
    // Input must be [Image, Text]
    if (!attachment) {
      throw new Error("Please upload an image to edit.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [
          {
            inlineData: {
              data: attachment.base64,
              mimeType: attachment.mimeType
            }
          },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return {
          mediaUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          mediaType: 'image',
          text: "Edited with Gemini 2.5 Flash Image"
        };
      }
    }
     // Fallback if model just returns text saying it can't do it
     if (response.text) {
        return { text: response.text };
     }
     throw new Error("Image editing failed.");
  }

  // --- 4. Text / Analysis (Gemini Flash Lite or Pro) ---
  if (mode === AppMode.Chat) {
    // Use Pro if image is attached (Analysis), otherwise Flash Lite for speed
    const modelName = attachment ? 'gemini-3-pro-preview' : 'gemini-flash-lite-latest';
    
    const parts: any[] = [{ text: prompt }];
    if (attachment) {
      parts.unshift({
        inlineData: {
          data: attachment.base64,
          mimeType: attachment.mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts }
    });

    return { text: response.text };
  }

  throw new Error("Invalid mode selected");
};