import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

class PkceSessionService {
  private static instance: PkceSessionService;
  private readonly SESSION_PREFIX = "pkce_session_";

  private constructor() {}

  static getInstance(): PkceSessionService {
    if (!PkceSessionService.instance) {
      PkceSessionService.instance = new PkceSessionService();
    }
    return PkceSessionService.instance;
  }

  async storeInSession(stateId: string, codeVerifier: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${this.SESSION_PREFIX}${stateId}`,
        codeVerifier,
      );
    } catch (error) {
      console.error("Error storing PKCE session:", error);
      throw error;
    }
  }

  async getFromSession(
    stateId: string,
    options?: { remove?: boolean },
  ): Promise<string | undefined> {
    try {
      const key = `${this.SESSION_PREFIX}${stateId}`;
      const codeVerifier = await AsyncStorage.getItem(key);

      if (codeVerifier) {
        console.log(`Code verifier found in session ${stateId}`);
        if (options?.remove) {
          await AsyncStorage.removeItem(key);
        }
        return codeVerifier;
      } else {
        console.warn(`No code verifier found in session ${stateId}`);
        return undefined;
      }
    } catch (error) {
      console.error("Error getting PKCE session:", error);
      return undefined;
    }
  }
}

export default PkceSessionService.getInstance();

// Base64URL encoding for React Native
function base64urlEncode(buffer: ArrayBuffer): string {
  // Convert ArrayBuffer to base64 using manual encoding (btoa not available in RN)
  const bytes = new Uint8Array(buffer);
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;

  while (i < bytes.length) {
    const a = bytes[i++];
    const b = i < bytes.length ? bytes[i++] : 0;
    const c = i < bytes.length ? bytes[i++] : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += chars.charAt((bitmap >> 18) & 63);
    result += chars.charAt((bitmap >> 12) & 63);
    result += i - 2 < bytes.length ? chars.charAt((bitmap >> 6) & 63) : "=";
    result += i - 1 < bytes.length ? chars.charAt(bitmap & 63) : "=";
  }

  // Convert to base64url
  return result.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate a random code verifier for PKCE
 */
export function generateCodeVerifier(): string {
  const randomBytes = new Uint8Array(32);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(randomBytes);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < randomBytes.length; i++) {
      randomBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return base64urlEncode(randomBytes.buffer);
}

/**
 * Generate a code challenge from a code verifier using SHA-256
 */
export async function generateCodeChallenge(
  codeVerifier: string,
): Promise<string> {
  try {
    // Use expo-crypto for React Native with base64 encoding
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 },
    );
    // Convert base64 to base64url (replace + with -, / with _, and remove padding)
    return digest.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch (error) {
    console.error("Error generating code challenge:", error);
    throw error;
  }
}
