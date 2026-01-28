import React, { useState } from 'react';
import { Box, VStack, HStack, Text, Badge, Pressable, Button } from 'native-base';
import { Modal, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { Device, SystemRating, EmulationSystem } from '../../types/device.model';
import { colors } from '../../theme/colors';
import { getSystemShortName } from '../../utils/device-helpers';

interface EmulationCapabilitiesProps {
  device: Device;
}

const ratingDescriptions: Record<string, string> = {
  ALL: 'Excellent on all systems',
  A: 'Excellent - Runs perfectly',
  B: 'Playable - Works well',
  C: 'Playable with tweaks - Needs configuration',
  D: 'Barely works - Significant issues',
  E: 'Poor - Major problems',
  F: "Doesn't work - Not functional",
};

const getRatingColor = (ratingMark: string): string => {
  const mark = ratingMark.toUpperCase();
  switch (mark) {
    case 'ALL':
    case 'A':
      return colors.success; // Green
    case 'B':
      return colors.primary; // Orange
    case 'C':
      return colors.warning; // Orange/yellow
    case 'D':
      return colors.error; // Red
    case 'E':
    case 'F':
      return colors.textTertiary; // Gray
    default:
      return colors.textSecondary;
  }
};

export function EmulationCapabilities({ device }: EmulationCapabilitiesProps) {
  const systemRatings = device.systemRatings || [];
  const [selectedRating, setSelectedRating] = useState<SystemRating | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  if (systemRatings.length === 0) {
    return null;
  }

  // Sort by system difficulty order (same as EmulationSystemOrder)
  const systemOrder: Record<EmulationSystem, number> = {
    [EmulationSystem.Genesis]: 1,
    [EmulationSystem.Dreamcast]: 2,
    [EmulationSystem.Saturn]: 3,
    [EmulationSystem.GameBoy]: 4,
    [EmulationSystem.GameBoyAdvance]: 5,
    [EmulationSystem.NES]: 6,
    [EmulationSystem.SNES]: 7,
    [EmulationSystem.Nintendo64]: 8,
    [EmulationSystem.NintendoDS]: 9,
    [EmulationSystem.Nintendo3DS]: 10,
    [EmulationSystem.GameCube]: 11,
    [EmulationSystem.Wii]: 12,
    [EmulationSystem.WiiU]: 13,
    [EmulationSystem.PSP]: 14,
    [EmulationSystem.PS1]: 15,
    [EmulationSystem.PS2]: 16,
    [EmulationSystem.PS3]: 17,
    [EmulationSystem.Switch]: 18,
    [EmulationSystem.All]: 19,
  };

  const sortedRatings = [...systemRatings].sort((a, b) => {
    return (systemOrder[a.system] || 0) - (systemOrder[b.system] || 0);
  });

  const handleBadgePress = (rating: SystemRating) => {
    setSelectedRating(rating);
    setShowModal(true);
  };

  const getModalContent = () => {
    if (!selectedRating) return null;
    
    const ratingMark = selectedRating.ratingMark.toUpperCase();
    const systemName = selectedRating.system === EmulationSystem.All 
      ? 'All Systems' 
      : getSystemShortName(selectedRating.system);
    const description = ratingDescriptions[ratingMark] || ratingMark;
    const ratingColor = getRatingColor(ratingMark);
    
    return (
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <Box
                bg={colors.backgroundCard}
                borderRadius="md"
                width="90%"
                maxWidth={400}
                borderWidth={1}
                borderColor={colors.border}
              >
                {/* Header */}
                <Box
                  bg={colors.backgroundCard}
                  borderBottomWidth={1}
                  borderBottomColor={colors.border}
                  p={4}
                >
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack space={2} alignItems="center" flex={1}>
                      <Badge
                        bg={ratingColor}
                        borderRadius="full"
                        px={3}
                        py={1}
                      >
                        <Text fontSize="md" color={colors.textPrimary} fontWeight="bold">
                          {ratingMark}
                        </Text>
                      </Badge>
                      <Text fontSize="lg" color={colors.textPrimary} fontWeight="bold" flex={1}>
                        {systemName}
                      </Text>
                    </HStack>
                    <Pressable onPress={() => setShowModal(false)} ml={2}>
                      <Text fontSize="xl" color={colors.textSecondary}>×</Text>
                    </Pressable>
                  </HStack>
                </Box>

                {/* Body */}
                <Box bg={colors.backgroundCard} p={4}>
                  <VStack space={3}>
                    <Text fontSize="md" color={colors.textPrimary} fontWeight="semibold">
                      {description}
                    </Text>
                    {selectedRating.ratingNumber !== null && (
                      <Text fontSize="sm" color={colors.textSecondary}>
                        Rating: {selectedRating.ratingNumber}/5
                      </Text>
                    )}
                    <Text fontSize="xs" color={colors.textTertiary} mt={2}>
                      Tap anywhere to close
                    </Text>
                  </VStack>
                </Box>
              </Box>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <Box bg={colors.backgroundCard} p={4} borderRadius="md">
      <Text fontSize="lg" fontWeight="bold" color={colors.textPrimary} mb={4}>
        Emulation Capabilities
      </Text>
      <HStack space={2} flexWrap="wrap">
        {sortedRatings.map((rating: SystemRating) => {
          const ratingMark = rating.ratingMark.toUpperCase();
          const systemName = rating.system === EmulationSystem.All 
            ? 'All' 
            : getSystemShortName(rating.system);
          const ratingColor = getRatingColor(ratingMark);
          
          return (
            <Pressable
              key={rating.system}
              onPress={() => handleBadgePress(rating)}
              mb={2}
            >
              {({ isPressed }) => (
                <Badge
                  bg={ratingColor}
                  borderRadius="full"
                  px={3}
                  py={1.5}
                  opacity={isPressed ? 0.7 : 1}
                >
                  <Text fontSize="sm" color={colors.textPrimary} fontWeight="bold">
                    {systemName}
                  </Text>
                </Badge>
              )}
            </Pressable>
          );
        })}
      </HStack>
      {getModalContent()}
    </Box>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
