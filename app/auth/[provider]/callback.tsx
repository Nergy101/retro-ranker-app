import React, { useEffect, useRef, useState } from "react";
import { Center, Spinner, Text, VStack } from "native-base";
import {
  useLocalSearchParams,
  useRootNavigationState,
  useRouter,
} from "expo-router";
import { colors } from "../../../theme/colors";
import { useAuth } from "../../../contexts/AuthContext";
import pkceSessionService from "../../../services/auth/pkce.service";
import { API_BASE_URL } from "../../../utils/constants";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { signInWithOAuth, loading: authLoading, initialized } = useAuth();
  const { provider, code, state } = useLocalSearchParams<{
    provider?: string;
    code?: string;
    state?: string;
  }>();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Initializing...");
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // Track processing state to handle StrictMode double-mount
  const processingRef = useRef<"idle" | "running" | "done">("idle");

  // Defer navigation until root layout is mounted (fixes cold start / deep link)
  useEffect(() => {
    if (!rootNavigationState?.key || !pendingRedirect) return;
    try {
      router.replace(pendingRedirect);
      setPendingRedirect(null);
    } catch (navErr) {
      console.error("[OAuth Callback] Navigation error:", navErr);
    }
  }, [rootNavigationState?.key, pendingRedirect, router]);

  useEffect(() => {
    // Wait for auth context to be fully initialized (important for cold start via deep link)
    if (!initialized || authLoading || !signInWithOAuth) {
      console.log("[OAuth Callback] Waiting for auth to initialize...", {
        initialized,
        authLoading,
        hasSignInWithOAuth: !!signInWithOAuth,
      });
      return;
    }

    // If already running or done, don't run again
    if (processingRef.current !== "idle") {
      console.log(
        "[OAuth Callback] Already",
        processingRef.current,
        "- skipping",
      );
      return;
    }

    // Mark as running immediately (sync, before any await)
    processingRef.current = "running";

    console.log("[OAuth Callback] Starting with:", {
      provider,
      code: code ? "present" : "missing",
      state: state ? "present" : "missing",
    });

    const completeOAuth = async () => {
      const p = provider === "google" || provider === "discord"
        ? provider
        : null;

      if (!p || !code || !state) {
        console.log("[OAuth Callback] Missing params:", {
          p,
          code: !!code,
          state: !!state,
        });
        processingRef.current = "done";
        setError("Missing OAuth parameters");
        setStatus("Redirecting...");
        setPendingRedirect("/(tabs)/profile");
        return;
      }

      try {
        setStatus("Verifying session...");
        console.log("[OAuth Callback] Getting code verifier for state:", state);

        let codeVerifier: string | undefined;
        try {
          codeVerifier = await pkceSessionService.getFromSession(state, {
            remove: true,
          });
        } catch (storageErr) {
          console.error("[OAuth Callback] Storage error:", storageErr);
          // On cold start, storage might not be ready - wait a bit and retry
          await new Promise((resolve) => setTimeout(resolve, 500));
          codeVerifier = await pkceSessionService.getFromSession(state, {
            remove: true,
          });
        }

        console.log(
          "[OAuth Callback] Code verifier:",
          codeVerifier ? "found" : "NOT FOUND",
        );

        if (!codeVerifier) {
          // Session expired - redirect gracefully without error banner
          console.log(
            "[OAuth Callback] Session expired, redirecting to profile",
          );
          processingRef.current = "done";
          setStatus("Session expired. Redirecting...");
          setPendingRedirect("/(tabs)/profile");
          return;
        }

        setStatus("Exchanging tokens...");
        console.log(
          "[OAuth Callback] Calling signInWithOAuth for provider:",
          p,
        );

        // Exchange code for token using the website callback URL
        const websiteCallbackUrl = `${API_BASE_URL}/api/auth/${p}/callback`;
        await signInWithOAuth(p, code, codeVerifier, websiteCallbackUrl);

        console.log("[OAuth Callback] Sign in successful!");
        processingRef.current = "done";
        setStatus("Success! Redirecting...");
        setPendingRedirect("/(tabs)/profile");
      } catch (err) {
        console.error("[OAuth Callback] Error:", err);
        processingRef.current = "done";
        const errorMessage = err instanceof Error
          ? err.message
          : "OAuth failed";
        setError(errorMessage);
        setStatus("Login failed");
        setPendingRedirect("/(tabs)/profile");
      }
    };

    // Run immediately - don't use setTimeout that gets cleared by StrictMode
    completeOAuth();
  }, [
    provider,
    code,
    state,
    router,
    signInWithOAuth,
    authLoading,
    initialized,
  ]);

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
