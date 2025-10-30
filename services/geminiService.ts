/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";
import { db, base64ToBlob } from '../lib/utils';
import { checkAllLimits } from '../lib/rateLimiter';
import { billingService } from './billingService';
import { UsageLimitError } from '../types/billing';

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

const urlToPart = async (url: string) => {
    // Fetch image from URL and convert to part
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    const file = new File([blob], 'garment', { type: blob.type });
    return fileToPart(file);
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
    checkAllLimits(); // Check rate limits before API call
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

export const generateVirtualTryOnImage = async (
    modelImageId: string, 
    garmentImage: File | string,  // Accept both File and URL string
    garmentCategory: string
): Promise<string> => {
    await db.init();
    
    // Check usage limits before making API call
    const { allowed, reason } = billingService.canMakeRequest();
    if (!allowed) {
        throw new UsageLimitError(reason || 'Usage limit exceeded', 0, 0, billingService.getUserBilling().subscription.tier);
    }
    
    checkAllLimits(); // Check rate limits before API call
    const modelImagePart = await dbImageIdToPart(modelImageId);
    
    // Handle both File and URL string for garment
    let garmentImagePart;
    if (typeof garmentImage === 'string') {
        // It's a URL string - fetch and convert to part
        garmentImagePart = await urlToPart(garmentImage);
    } else {
        // It's a File object
        garmentImagePart = await fileToPart(garmentImage);
    }
    
    const isAccessory = garmentCategory === 'Accessories';

    // Category-specific replacement instructions with preservation rules
    const categoryInstructions: Record<string, string> = {
        'Tops': `ONLY replace the upper body clothing (shirt/t-shirt/blouse/top).
        - REMOVE: Any existing shirt, t-shirt, blouse, or upper body garment
        - REPLACE WITH: The new top from the garment image
        - PRESERVE: All bottoms (pants/jeans/skirts), outerwear (jackets/blazers), shoes, and accessories exactly as they are`,
        
        'Bottoms': `ONLY replace the lower body clothing (pants/jeans/skirt).
        - REMOVE: Any existing pants, trousers, jeans, skirt, or lower body garment
        - REPLACE WITH: The new bottom from the garment image
        - PRESERVE: All tops (shirts/blouses), outerwear (jackets/blazers), shoes, and accessories exactly as they are`,
        
        'Dresses': `Replace the entire dress/full outfit.
        - REMOVE: The entire current outfit (both top and bottom)
        - REPLACE WITH: The new dress from the garment image
        - PRESERVE: Only shoes and accessories if present`,
        
        'Outerwear': `ONLY replace the outer layer (jacket/blazer/coat).
        - REMOVE: Any existing jacket, blazer, coat, cardigan, or outer layer
        - REPLACE WITH: The new outerwear from the garment image
        - PRESERVE: All inner clothing (shirt/top underneath), bottoms (pants), shoes, and accessories exactly as they are. The inner clothing should be visible where appropriate (collar, sleeves if jacket is open, etc.)`,
        
        'Shoes': `ONLY replace the footwear.
        - REMOVE: Any existing shoes, sneakers, boots, sandals, or footwear
        - REPLACE WITH: The new shoes from the garment image
        - PRESERVE: All clothing (tops, bottoms, outerwear), and accessories exactly as they are`,
        
        'Indian Festive': `Replace the entire traditional outfit.
        - REMOVE: The entire current outfit (all clothing items)
        - REPLACE WITH: The new traditional outfit from the garment image
        - PRESERVE: Only shoes and accessories if appropriate for the traditional outfit`,
        
        'Custom': `Replace the specific garment intelligently.
        - REMOVE: Any existing clothing that occupies the same body area as the new garment
        - REPLACE WITH: The new garment from the garment image
        - PRESERVE: All other clothing items not in the same category`
    };

    const categoryInstruction = categoryInstructions[garmentCategory] || categoryInstructions['Custom'];

    const clothingPrompt = `You are an expert virtual try-on AI specialist. You will be given a 'model image' showing a person in their current outfit, and a 'garment image' showing a new clothing item. Your task is to intelligently replace ONLY the specific category of clothing while preserving everything else.

**Target Category: ${garmentCategory}**

**Your Instructions:**
${categoryInstruction}

**Critical Rules:**
1.  **Selective Replacement:** ONLY modify the clothing in the target category (${garmentCategory}). All other clothing categories MUST remain completely unchanged and visible.
2.  **Complete Category Removal:** Fully remove the old item from the target category. No traces, edges, colors, or patterns from the old ${garmentCategory.toLowerCase()} should remain visible.
3.  **Preserve Everything Else:** 
    - Keep the person's face, hair, body shape, skin tone, and pose exactly the same
    - Keep all clothing from OTHER categories exactly as they appear in the model image
    - Keep the background completely unchanged
    - Maintain all accessories (watches, jewelry, bags, etc.)
4.  **Realistic Integration:** The new ${garmentCategory.toLowerCase()} should fit naturally with:
    - The person's pose and body
    - The lighting and shadows of the scene
    - Any remaining clothing items (proper layering, no overlap issues)
    - Natural folds, wrinkles, and fabric behavior
5.  **Smart Layering:** Understand clothing layers:
    - Tops go under outerwear (jackets/blazers)
    - Outerwear goes over tops
    - Bottoms are independent from tops and outerwear
    - Accessories stack on top of everything
6.  **Output:** Return ONLY the final edited image with no text or explanations.

**Example:** If replacing a blue shirt with a red shirt while the person is wearing grey pants and a black jacket, the result should show: red shirt (new), grey pants (preserved), black jacket (preserved) - all properly layered.`;

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
    const imageId = await handleApiResponse(response);
    
    // Consume credit after successful generation
    billingService.consumeTryOn('try-on');
    
    return imageId;
};

export const generatePoseVariation = async (tryOnImageId: string, poseInstruction: string): Promise<string> => {
    await db.init();
    checkAllLimits(); // Check rate limits before API call
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
    
    // Check usage limits before making the request
    const usageCheck = billingService.canMakeRequest();
    if (!usageCheck.allowed) {
        throw new UsageLimitError(
            usageCheck.reason || 'Usage limit reached',
            usageCheck.billing.usage.tryOnsUsed,
            usageCheck.billing.usage.tryOnsLimit,
            usageCheck.billing.subscription.tier
        );
    }
    
    checkAllLimits(); // Check rate limits before API call
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
    
    // Consume the try-on credit after successful generation
    billingService.consumeTryOn('chat-edit');
    
    return handleApiResponse(response);
};