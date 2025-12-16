import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateTryOnImage(
  userImageUrl: string,
  clothingImageUrl: string,
  prompt: string
): Promise<string> {
  try {
    const userImageResponse = await fetch(userImageUrl);
    const userImageBuffer = await userImageResponse.arrayBuffer();
    const userImageBase64 = Buffer.from(userImageBuffer).toString("base64");
    const userImageMimeType = userImageResponse.headers.get("content-type") || "image/jpeg";

    const clothingImageResponse = await fetch(clothingImageUrl);
    const clothingImageBuffer = await clothingImageResponse.arrayBuffer();
    const clothingImageBase64 = Buffer.from(clothingImageBuffer).toString("base64");
    const clothingImageMimeType = clothingImageResponse.headers.get("content-type") || "image/jpeg";

    const fullPrompt = prompt
      .replace("{user_image}", "the person in the first image")
      .replace("{clothing_image}", "the clothing in the second image");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: userImageBase64,
                mimeType: userImageMimeType,
              },
            },
            {
              inlineData: {
                data: clothingImageBase64,
                mimeType: clothingImageMimeType,
              },
            },
            { text: fullPrompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Gemini");
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("No content in response");
    }

    for (const part of content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating try-on image:", error);
    throw error;
  }
}
