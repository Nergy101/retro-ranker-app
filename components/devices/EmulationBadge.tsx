import React from 'react';
import { Badge, Text } from 'native-base';
import { SystemRating, EmulationSystem } from '../../types/device.model';
import { colors } from '../../theme/colors';
import { getSystemShortName } from '../../utils/device-helpers';

interface EmulationBadgeProps {
  rating: SystemRating;
  type: 'upToA' | 'upToC';
}

export function EmulationBadge({ rating, type }: EmulationBadgeProps) {
  const ratingMark = rating.ratingMark.toUpperCase();
  
  // Determine badge color based on rating
  const getBadgeColor = () => {
    if (type === 'upToA') {
      return colors.success; // Green for excellent (A rating)
    } else {
      // For C or lower ratings
      if (ratingMark === 'C') return colors.warning; // Orange/yellow
      if (ratingMark === 'D') return colors.error; // Red
      return colors.textTertiary; // Gray for E/F
    }
  };

  const getLabel = () => {
    if (rating.system === EmulationSystem.All) {
      return 'All';
    }
    const systemName = getSystemShortName(rating.system);
    return systemName;
  };

  return (
    <Badge
      bg={getBadgeColor()}
      borderRadius="full"
      px={1.5}
      py={0.5}
    >
      <Text fontSize={10} color={colors.textPrimary} fontWeight="semibold">
        {getLabel()}
      </Text>
    </Badge>
  );
}
