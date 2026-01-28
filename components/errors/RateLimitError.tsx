import React from "react";
import { Box, Button, Center, HStack, Text, VStack } from "native-base";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

interface RateLimitErrorProps {
  onRetry?: () => void;
  retryAfterMinutes?: number;
}

export function RateLimitError({
  onRetry,
  retryAfterMinutes = 5,
}: RateLimitErrorProps) {
  return (
    <Center flex={1} bg={colors.background} px={6}>
      <VStack space={4} alignItems="center" maxWidth="90%">
        <Box
          bg={colors.backgroundCard}
          borderRadius="full"
          p={4}
          borderWidth={2}
          borderColor={colors.error}
        >
          <Feather name="clock" size={48} color={colors.error} />
        </Box>

        <VStack space={2} alignItems="center">
          <Text
            fontSize="2xl"
            fontWeight="bold"
            color={colors.textPrimary}
            textAlign="center"
          >
            Too Many Requests
          </Text>
          <Text
            fontSize="md"
            color={colors.textSecondary}
            textAlign="center"
            lineHeight={24}
          >
            You've made too many requests in a short period of time. Please wait
            a few minutes before trying again.
          </Text>
        </VStack>

        <Box
          bg={colors.backgroundCard}
          borderRadius="md"
          p={4}
          borderWidth={1}
          borderColor={colors.border}
          width="100%"
        >
          <VStack space={2}>
            <HStack alignItems="center" space={2}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text fontSize="sm" fontWeight="semibold" color={colors.textPrimary}>
                What happened?
              </Text>
            </HStack>
            <Text fontSize="sm" color={colors.textSecondary} pl={6}>
              Our servers limit the number of requests per minute to ensure fair
              usage for all users. You've exceeded this limit.
            </Text>
          </VStack>
        </Box>

        <Box
          bg={colors.backgroundCard}
          borderRadius="md"
          p={4}
          borderWidth={1}
          borderColor={colors.border}
          width="100%"
        >
          <VStack space={2}>
            <HStack alignItems="center" space={2}>
              <Feather name="clock" size={16} color={colors.primary} />
              <Text fontSize="sm" fontWeight="semibold" color={colors.textPrimary}>
                What to do?
              </Text>
            </HStack>
            <Text fontSize="sm" color={colors.textSecondary} pl={6}>
              Please wait approximately {retryAfterMinutes} minutes before trying
              again. The limit will reset automatically.
            </Text>
          </VStack>
        </Box>

        {onRetry && (
          <Button
            onPress={onRetry}
            bg={colors.primary}
            _pressed={{ bg: colors.primaryHover }}
            size="md"
            width="100%"
            mt={2}
          >
            <HStack space={2} alignItems="center" justifyContent="center">
              <Feather name="refresh-cw" size={16} color={colors.textPrimary} />
              <Text color={colors.textPrimary} fontWeight="semibold">
                Try Again
              </Text>
            </HStack>
          </Button>
        )}
      </VStack>
    </Center>
  );
}
