import React, { useEffect, useState, useRef } from "react";
import { Center, Spinner, Text, VStack } from "native-base";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors } from "../../../theme/colors";
import { useAuth } from "../../../contexts/AuthContext";
import pkceSessionService from "../../../services/auth/pkce.service";

const API_BASE_URL = "https://retroranker.site";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { signInWithOAuth } = useAuth();
  const { provider, code, state } = useLocalSearchParams<{
    provider?: string;
    code?: string;
    state?: string;
  }>();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Initializing...");
  
  // Track processing state to handle StrictMode double-mount
  const processingRef = useRef<'idle' | 'running' | 'done'>('idle');

  useEffect(() => {
    // If already running or done, don't run again
    if (processingRef.current !== 'idle') {
      console.log("[OAuth Callback] Already", processingRef.current, "- skipping");
      return;
    }
    
    // Mark as running immediately (sync, before any await)
    processingRef.current = 'running';

    console.log("[OAuth Callback] Starting with:", { 
      provider, 
      code: code ? "present" : "missing", 
      state: state ? "present" : "missing" 
    });

    const completeOAuth = async () => {
      
      const p = provider === "google" || provider === "discord" ? provider : null;

      if (!p || !code || !state) {
        console.log("[OAuth Callback] Missing params:", { p, code: !!code, state: !!state });
        processingRef.current = 'done';
        setError("Missing OAuth parameters");
        setStatus("Redirecting...");
        setTimeout(() => {
          router.replace("/auth/sign-in");
        }, 500);
        return;
      }

      try {
        setStatus("Verifying session...");
        console.log("[OAuth Callback] Getting code verifier for state:", state);
        
        const codeVerifier = await pkceSessionService.getFromSession(state, {
          remove: true,
        });

        console.log("[OAuth Callback] Code verifier:", codeVerifier ? "found" : "NOT FOUND");

        if (!codeVerifier) {
          throw new Error("Session expired - please try again");
        }

        setStatus("Exchanging tokens...");
        console.log("[OAuth Callback] Calling signInWithOAuth for provider:", p);
        
        // Exchange code for token using the website callback URL
        const websiteCallbackUrl = `${API_BASE_URL}/api/auth/${p}/callback`;
        await signInWithOAuth(p, code, codeVerifier, websiteCallbackUrl);

        console.log("[OAuth Callback] Sign in successful!");
        processingRef.current = 'done';
        setStatus("Success! Redirecting...");
        
        // Navigate to profile on success
        setTimeout(() => {
          console.log("[OAuth Callback] Navigating to profile");
          router.replace("/(tabs)/profile");
        }, 100);
      } catch (err) {
        console.error("[OAuth Callback] Error:", err);
        processingRef.current = 'done';
        setError(err instanceof Error ? err.message : "OAuth failed");
        setStatus("Login failed");
        setTimeout(() => {
          router.replace("/auth/sign-in");
        }, 2000);
      }
    };

    // Run immediately - don't use setTimeout that gets cleared by StrictMode
    completeOAuth();
  }, [provider, code, state, router, signInWithOAuth]);

  return (
    <Center flex={1} bg={colors.background}>
      <VStack space={4} alignItems="center" p={6}>
        <Spinner size="lg" color={error ? colors.error : colors.primary} />
        <Text 
          color={error ? colors.error : colors.textPrimary} 
          fontSize="lg"
          fontWeight="semibold"
          textAlign="center"
        >
          {error || status}
        </Text>
        {!error && (
          <Text color={colors.textSecondary} fontSize="sm" textAlign="center">
            Please wait...
          </Text>
        )}
      </VStack>
    </Center>
  );
}
