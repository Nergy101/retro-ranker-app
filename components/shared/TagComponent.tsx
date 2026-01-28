import React from "react";
import { Badge, Pressable, Text, HStack } from "native-base";
import { Feather } from "@expo/vector-icons";
import { TAG_FRIENDLY_NAMES, TagModel } from "../../types/tag.model";
import { colors } from "../../theme/colors";

interface TagComponentProps {
  tag: TagModel;
  size?: "xs" | "sm" | "md";
  onPress?: () => void;
  isSelected?: boolean;
  showRemoveIcon?: boolean;
  onRemove?: () => void;
}

export function TagComponent({ 
  tag, 
  size = "xs", 
  onPress, 
  isSelected = false,
  showRemoveIcon = false,
  onRemove
}: TagComponentProps) {
  const fontSize = size === "xs" ? "xs" : size === "sm" ? "sm" : "md";

  const badge = (
    <Badge
      bg={isSelected ? colors.primary : "transparent"}
      borderWidth={1}
      borderColor={colors.primary}
      borderRadius="full"
      px={1.5}
      py={0.5}
      alignItems="center"
      mr={1.5}
      mb={1.5}
    >
      <HStack alignItems="center" space={1}>
        <Text fontSize={fontSize} color={isSelected ? colors.textPrimary : colors.primary}>
          {tag.name}
        </Text>
        {showRemoveIcon && onRemove && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            p={0.5}
            ml={0.5}
          >
            <Feather name="x" size={10} color={isSelected ? colors.textPrimary : colors.primary} />
          </Pressable>
        )}
      </HStack>
    </Badge>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress}>
        {badge}
      </Pressable>
    );
  }

  return badge;
}
