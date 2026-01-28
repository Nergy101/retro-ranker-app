import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Center,
  Spinner,
  Image,
} from 'native-base';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Linking as ReactNativeLinking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { generateCodeVerifier, generateCodeChallenge } from '../../services/auth/pkce.service';
import pkceSessionService from '../../services/auth/pkce.service';
import { colors } from '../../theme/colors';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

const API_BASE_URL = 'https://retroranker.site';

function getMobileRedirectUrl(provider: 'google' | 'discord'): string {
  // Expo Go needs an exp://... style URL (Safari can open it back into Expo Go).
  if (Constants.appOwnership === 'expo' && Constants.linkingUri) {
    // Constants.linkingUri typically ends with "/--/" in Expo Go.
    return `${Constants.linkingUri}auth/${provider}/callback`;
  }

  // Standalone/dev builds: use the app scheme from app.json (`retroranker://...`).
  return Linking.createURL(`auth/${provider}/callback`);
}

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithOAuth, authenticated, user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      try {
        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get('code');
        const state = parsedUrl.searchParams.get('state');
        const provider = parsedUrl.pathname.includes('google') ? 'google' : 'discord';

        if (code && state) {
          setOauthLoading(provider);
          const codeVerifier = await pkceSessionService.getFromSession(state, { remove: true });

          if (!codeVerifier) {
            throw new Error('Invalid OAuth session');
          }

          // This must match the redirect_uri used for the provider's authorization code.
          // Our server uses an HTTPS website callback for Discord/Google, so we must use that
          // when exchanging the code for tokens with PocketBase.
          const websiteCallbackUrl = `${API_BASE_URL}/api/auth/${provider}/callback`;
          await signInWithOAuth(provider, code, codeVerifier, websiteCallbackUrl);
          
          // Navigate to profile on success
          router.replace('/(tabs)/profile');
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err instanceof Error ? err.message : 'OAuth authentication failed');
        setOauthLoading(null);
      }
    };

    // Check if we're coming from OAuth callback
    if (params.code && params.state) {
      const provider = params.provider as 'google' | 'discord' | undefined;
      if (provider) {
        const callbackUrl = Linking.createURL(`auth/${provider}/callback`, {
          queryParams: { code: String(params.code), state: String(params.state) },
        });
        handleDeepLink(callbackUrl);
      }
    }

    // Listen for deep links
    const subscription = ReactNativeLinking.addEventListener('url', (event) => {
      if (event.url.includes('/auth/')) {
        handleDeepLink(event.url);
      }
    });

    // Check for initial URL (app opened via deep link)
    ReactNativeLinking.getInitialURL().then((url) => {
      if (url && url.includes('/auth/')) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [params, signInWithOAuth, router]);

  // Redirect if already authenticated
  useEffect(() => {
    if (authenticated && user && !authLoading) {
      router.replace('/(tabs)/profile');
    }
  }, [authenticated, user, authLoading, router]);

  const handleOAuthSignIn = async (provider: 'google' | 'discord') => {
    try {
      setError(null);
      setOauthLoading(provider);

      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      // Generate UUID-like string for state
      const state = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });

      await pkceSessionService.storeInSession(state, codeVerifier);

      // This is the URL the server will redirect to after completing OAuth.
      // In Expo Go, this becomes an exp://... URL that iOS can open.
      // In a standalone/dev build, this becomes retroranker://... (based on `app.json` scheme).
      const redirectUrl = getMobileRedirectUrl(provider);
      
      // Pass redirect_uri to server so it knows to redirect back to app
      const encodedRedirectUrl = encodeURIComponent(redirectUrl);
      let oauthUrl: string;
      if (provider === 'google') {
        oauthUrl = `${API_BASE_URL}/api/auth/google?state=${state}&code_challenge=${encodeURIComponent(codeChallenge)}&redirect_uri=${encodedRedirectUrl}`;
      } else {
        oauthUrl = `${API_BASE_URL}/api/auth/discord?state=${state}&code_challenge=${encodeURIComponent(codeChallenge)}&redirect_uri=${encodedRedirectUrl}`;
      }

      // Open OAuth URL in browser
      const canOpen = await ReactNativeLinking.canOpenURL(oauthUrl);
      if (canOpen) {
        await ReactNativeLinking.openURL(oauthUrl);
      } else {
        throw new Error('Cannot open OAuth URL');
      }
    } catch (err) {
      console.error('OAuth sign in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start OAuth flow');
      setOauthLoading(null);
    }
  };

  if (authLoading) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size="lg" color={colors.primary} />
        <Text color={colors.textSecondary} mt={4}>
          Loading...
        </Text>
      </Center>
    );
  }

  const getLoggingInText = () => {
    const texts = [
      'Pressing Start',
      'Inserting Cartridge',
      'Booting Up',
      'Loading Save',
      'Continuing Game',
      'Joining Party',
      'Entering Dungeon',
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  return (
    <Box flex={1} bg={colors.background}>
      <VStack
        flex={1}
        space={6}
        p={6}
        pt={Math.max(insets.top, 16)}
        justifyContent="center"
        alignItems="center"
      >
        {/* Logo */}
        <VStack space={2} alignItems="center" mb={8}>
          <Image
            source={{ uri: 'https://retroranker.site/logos/retro-ranker/rr-logo.png' }}
            alt="Retro Ranker Logo"
            width={64}
            height={64}
            resizeMode="contain"
          />
          <Text fontSize="2xl" fontWeight="bold" color={colors.textPrimary}>
            Log In
          </Text>
        </VStack>

        {oauthLoading ? (
          <VStack space={4} alignItems="center" p={6}>
            <Spinner size="lg" color={colors.primary} />
            <Text color={colors.textPrimary} fontSize="md">
              {getLoggingInText()}...
            </Text>
            <Text color={colors.textSecondary} fontSize="sm" textAlign="center">
              Please complete authentication in your browser
            </Text>
          </VStack>
        ) : (
          <VStack space={4} width="100%" maxW="400px">
            {error && (
              <Box
                bg={colors.error}
                p={3}
                borderRadius="md"
                mb={2}
              >
                <Text color={colors.textPrimary} fontSize="sm">
                  {error}
                </Text>
              </Box>
            )}

            <Text fontSize="md" color={colors.textSecondary} textAlign="center" mb={2}>
              Continue with
            </Text>

            <VStack space={3}>
              <Button
                onPress={() => handleOAuthSignIn('discord')}
                bg="#5865F2"
                _pressed={{ bg: '#4752C4' }}
                size="lg"
                isLoading={oauthLoading === 'discord'}
                isDisabled={!!oauthLoading}
              >
                <HStack space={2} alignItems="center">
                  <Text fontSize="xl">💬</Text>
                  <Text color={colors.textPrimary} fontWeight="semibold">
                    Discord
                  </Text>
                </HStack>
              </Button>

              <Button
                onPress={() => handleOAuthSignIn('google')}
                bg={colors.backgroundCard}
                borderWidth={1}
                borderColor={colors.border}
                _pressed={{ bg: colors.backgroundElevated }}
                size="lg"
                isLoading={oauthLoading === 'google'}
                isDisabled={!!oauthLoading}
              >
                <HStack space={2} alignItems="center">
                  <Text fontSize="xl">🔍</Text>
                  <Text color={colors.textPrimary} fontWeight="semibold">
                    Google
                  </Text>
                </HStack>
              </Button>
            </VStack>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
