/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { db, base64ToBlob } from '../lib/utils';

const fileToPart = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
    const { mimeType, data } = dataUrlToParts(dataUrl);
    return { inlineData: { mimeType, data } };
};

const dataUrlToParts = (dataUrl: string) => {
    const arr = dataUrl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");
    return { mimeType: mimeMatch[1], data: arr[1] };
}

const dbImageIdToPart = async (imageId: string) => {
    const blob = await db.getImage(imageId);
    if (!blob) {
      throw new Error(`Image with ID ${imageId} not found in the database.`);
    }
    return fileToPart(new File([blob], 'image', { type: blob.type }));
};


const handleApiResponse = async (response: GenerateContentResponse): Promise<string> => {
    if (response.promptFeedback?.blockReason) {
        const { blockReason, blockReasonMessage } = response.promptFeedback;
        const errorMessage = `Request was blocked. Reason: ${blockReason}. ${blockReasonMessage || ''}`;
        throw new Error(errorMessage);
    }

    for (const candidate of response.candidates ?? []) {
        const imagePart = candidate.content?.parts?.find(part => part.inlineData);
        if (imagePart?.inlineData) {
            const { mimeType, data } = imagePart.inlineData;
            const imageBlob = await base64ToBlob(data, mimeType);
            const imageId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            await db.putImage(imageBlob, imageId);
            return imageId;
        }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP') {
        const errorMessage = `Image generation stopped unexpectedly. Reason: ${finishReason}. This often relates to safety settings.`;
        throw new Error(errorMessage);
    }
    const textFeedback = response.text?.trim();
    const errorMessage = `The AI model did not return an image. ` + (textFeedback ? `The model responded with text: "${textFeedback}"` : "This can happen due to safety filters or if the request is too complex. Please try a different image.");
    throw new Error(errorMessage);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const model = 'gemini-2.5-flash-image';

export const generateModelImage = async (userImage: File): Promise<string> => {
    await db.init();
    const userImagePart = await fileToPart(userImage);
    const prompt = "You are an expert fashion photographer AI. Transform the person in this image into a full-body fashion model photo suitable for an e-commerce website. The background must be a clean, neutral studio backdrop (light gray, #f0f0f0). The person should have a neutral, professional model expression. Preserve the person's identity, unique features, and body type, but place them in a standard, relaxed standing model pose. The final image must be photorealistic. Return ONLY the final image.";
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [userImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateVirtualTryOnImage = async (modelImageId: string, garmentImage: File, garmentCategory: string): Promise<string> => {
    await db.init();
    const modelImagePart = await dbImageIdToPart(modelImageId);
    const garmentImagePart = await fileToPart(garmentImage);
    
    const isAccessory = garmentCategory === 'Accessories';

    const clothingPrompt = `You are an expert virtual try-on AI. You will be given a 'model image' and a 'garment image'. Your task is to create a new photorealistic image where the person from the 'model image' is wearing the clothing from the 'garment image'.

**Crucial Rules:**
1.  **Complete Garment Replacement:** You MUST completely REMOVE and REPLACE the clothing item worn by the person in the 'model image' with the new garment. No part of the original clothing (e.g., collars, sleeves, patterns) should be visible in the final image. For full outfits like dresses or sarees, replace the entire current outfit.
2.  **Preserve the Model:** The person's face, hair, body shape, and pose from the 'model image' MUST remain unchanged.
3.  **Preserve the Background:** The entire background from the 'model image' MUST be preserved perfectly.
4.  **Apply the Garment:** Realistically fit the new garment onto the person. It should adapt to their pose with natural folds, shadows, and lighting consistent with the original scene.
5.  **Output:** Return ONLY the final, edited image. Do not include any text.`;

    const accessoryPrompt = `You are an expert virtual try-on AI. You will be given a 'model image' and an 'accessory image'. Your task is to realistically ADD the accessory from the 'accessory image' onto the person in the 'model image'.

**Crucial Rules:**
1.  **Additive Process:** Do NOT remove or replace the person's existing clothing. You are only ADDING the accessory.
2.  **Correct Placement:** Place the accessory naturally and correctly (e.g., sunglasses on the face, a necklace around the neck, a hat on the head).
3.  **Preserve Everything Else:** The person's clothing, face, hair, body shape, pose, and the background from the 'model image' MUST remain unchanged.
4.  **Realistic Integration:** The accessory should integrate seamlessly with the scene, with lighting and shadows that are consistent with the original photo.
5.  **Output:** Return ONLY the final, edited image. Do not include any text.`;
    
    const prompt = isAccessory ? accessoryPrompt : clothingPrompt;

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [modelImagePart, garmentImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generatePoseVariation = async (tryOnImageId: string, poseInstruction: string): Promise<string> => {
    await db.init();
    const tryOnImagePart = await dbImageIdToPart(tryOnImageId);
    const prompt = `You are an expert fashion photographer AI. Take this image and regenerate it from a different perspective. The person, clothing, and background style must remain identical. The new perspective should be: "${poseInstruction}". Return ONLY the final image.`;
    const response = await ai.models.generateContent({
        model,
        contents: { parts: [tryOnImagePart, { text: prompt }] },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};

export const generateChatEdit = async (baseImageId: string, userPrompt: string, referenceImage?: File): Promise<string> => {
    await db.init();
    const modelImagePart = await dbImageIdToPart(baseImageId);
    
    const prompt = `You are an expert AI photo editor and fashion stylist. Edit the provided base image according to the user's request. The user's request is: "${userPrompt}". If a reference image is provided, use it for inspiration for the edit. Preserve the person's identity and the overall photorealistic style of the image. Only return the final edited image, with no other text or explanation.`;
    
    const parts: ({ inlineData: { mimeType: string; data: string; }; } | { text: string; })[] = [
        modelImagePart, 
        { text: prompt }
    ];

    if (referenceImage) {
        const referenceImagePart = await fileToPart(referenceImage);
        parts.splice(1, 0, referenceImagePart); // Insert reference image right after the base model image
    }

    const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    return handleApiResponse(response);
};