import { Box, Text } from "native-base";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetwork } from "../../contexts/NetworkContext";
import { colors } from "../../theme/colors";

/**
 * Compact banner shown when the device is offline.
 * Renders nothing when online.
 */
export function OfflineBanner() {
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();

  if (isConnected) return null;

  return (
    <Box
      bg={colors.warning}
      py={2}
      px={4}
      style={{ paddingTop: Math.max(insets.top, 8) + 8 }}
    >
      <Text color={colors.background} fontSize="sm" fontWeight="medium">
        You're offline. Showing cached content.
      </Text>
    </Box>
  );
}
