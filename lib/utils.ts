/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState, useEffect } from "react";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- IndexedDB Service ---
const DB_NAME = 'VismyrasImageDB';
const DB_VERSION = 1;
const STORE_NAME = 'images';

class ImageDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = () => {
                request.result.createObjectStore(STORE_NAME);
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => {
                console.warn('IndexedDB is blocked. Please close other tabs with this app open.');
                reject(new Error('IndexedDB is blocked'));
            }
        });
    }

    private getStore(mode: IDBTransactionMode): IDBObjectStore {
        if (!this.db) {
            throw new Error('Database is not initialized.');
        }
        return this.db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
    }

    async putImage(image: Blob, id: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const store = this.getStore('readwrite');
            const request = store.put(image, id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getImage(id: string): Promise<Blob | null> {
        return new Promise((resolve, reject) => {
            const store = this.getStore('readonly');
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
}
export const db = new ImageDB();


// --- React Hook for displaying DB images ---
export const useObjectURL = (id: string | null): string | null => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setUrl(null);
            return;
        }

        let isCancelled = false;
        let objectUrl: string | null = null;

        const loadUrl = async () => {
            const blob = await db.getImage(id);
            if (!isCancelled && blob) {
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            } else if (!isCancelled) {
                setUrl(null);
            }
        };

        loadUrl();

        return () => {
            isCancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    return url;
};


export function getFriendlyErrorMessage(error: unknown, context: string): string {
    let rawMessage = 'An unknown error occurred.';
    if (error instanceof Error) {
        rawMessage = error.message;
    } else if (typeof error === 'string') {
        rawMessage = error;
    } else if (error) {
        rawMessage = String(error);
    }

    if (rawMessage.includes("Unsupported MIME type")) {
        try {
            const errorJson = JSON.parse(rawMessage);
            const nestedMessage = errorJson?.error?.message;
            if (nestedMessage && nestedMessage.includes("Unsupported MIME type")) {
                const mimeType = nestedMessage.split(': ')[1] || 'unsupported';
                return `File type '${mimeType}' is not supported. Please use a format like PNG, JPEG, or WEBP.`;
            }
        } catch (e) {
            // Not a JSON string
        }
        return `Unsupported file format. Please upload an image format like PNG, JPEG, or WEBP.`;
    }
    
    return `${context}. ${rawMessage}`;
}

export const base64ToBlob = async (base64: string, mimeType: string): Promise<Blob> => {
    const res = await fetch(`data:${mimeType};base64,${base64}`);
    return await res.blob();
};

export const urlToFile = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Network request failed for ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    const mimeType = blob.type || 'image/png';
    return new File([blob], filename, { type: mimeType });
};