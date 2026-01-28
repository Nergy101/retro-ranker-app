import React from "react";
import { Box, Pressable, Text, VStack } from "native-base";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../../theme/colors";

interface SeeMoreCardProps {
  href?: string;
  text?: string;
  onPress?: () => void;
}

export function SeeMoreCard({
  href,
  text = "More devices",
  onPress,
}: SeeMoreCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (href) {
      router.push(href as any);
    }
  };

  return (
    <Pressable onPress={handlePress} flex={1}>
      <Box
        bg={colors.backgroundCard}
        borderRadius="md"
        borderWidth={1}
        borderColor={colors.border}
        flex={1}
        justifyContent="center"
        alignItems="center"
        p={4}
      >
        <VStack space={2} alignItems="center">
          <Feather
            name="arrow-right"
            size={32}
            color={colors.primary}
          />
          <Text
            fontSize="sm"
            color={colors.textPrimary}
            textAlign="center"
            fontWeight="medium"
          >
            {text}
          </Text>
        </VStack>
      </Box>
    </Pressable>
  );
}
