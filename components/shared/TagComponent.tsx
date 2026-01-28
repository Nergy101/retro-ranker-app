import React from 'react';
import { Badge, Text, Pressable } from 'native-base';
import { TagModel, TAG_FRIENDLY_NAMES } from '../../types/tag.model';
import { colors } from '../../theme/colors';

interface TagComponentProps {
  tag: TagModel;
  size?: 'xs' | 'sm' | 'md';
  onPress?: () => void;
}

export function TagComponent({ tag, size = 'xs', onPress }: TagComponentProps) {
  const fontSize = size === 'xs' ? 'xs' : size === 'sm' ? 'sm' : 'md';
  
  const badge = (
    <Badge
      bg="transparent"
      borderWidth={1}
      borderColor={colors.primary}
      borderRadius="full"
      px={1.5}
      py={0.5}
      alignItems="center"
      mr={1.5}
      mb={1.5}
    >
      <Text fontSize={fontSize} color={colors.primary}>
        {tag.name}
      </Text>
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
