import React, { useState, useEffect } from 'react';
import { Box, VStack, HStack, Text, Button, Pressable } from 'native-base';
import { TextInput } from 'react-native';
import { Device } from '../../types/device.model';
import { DeviceService } from '../../services/devices/device.service';
import { colors } from '../../theme/colors';

interface ComparisonFormProps {
  onCompare: (deviceA: Device, deviceB: Device) => void;
}

export function ComparisonForm({ onCompare }: ComparisonFormProps) {
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  const [suggestionsA, setSuggestionsA] = useState<Device[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<Device[]>([]);
  const [showSuggestionsA, setShowSuggestionsA] = useState(false);
  const [showSuggestionsB, setShowSuggestionsB] = useState(false);
  const [deviceA, setDeviceA] = useState<Device | null>(null);
  const [deviceB, setDeviceB] = useState<Device | null>(null);
  const [isFocusedA, setIsFocusedA] = useState(false);
  const [isFocusedB, setIsFocusedB] = useState(false);

  const deviceService = DeviceService.getInstance();

  useEffect(() => {
    const searchDevices = async () => {
      if (queryA.length > 0) {
        const results = await deviceService.searchDevices(queryA, 'all', 'all', 'all', [], 1, 5);
        setSuggestionsA(results.page.filter((d) => d.archived !== true));
        setShowSuggestionsA(true);
      } else {
        setSuggestionsA([]);
        setShowSuggestionsA(false);
      }
    };

    const timeoutId = setTimeout(searchDevices, 300);
    return () => clearTimeout(timeoutId);
  }, [queryA]);

  useEffect(() => {
    const searchDevices = async () => {
      if (queryB.length > 0) {
        const results = await deviceService.searchDevices(queryB, 'all', 'all', 'all', [], 1, 5);
        setSuggestionsB(results.page.filter((d) => d.archived !== true));
        setShowSuggestionsB(true);
      } else {
        setSuggestionsB([]);
        setShowSuggestionsB(false);
      }
    };

    const timeoutId = setTimeout(searchDevices, 300);
    return () => clearTimeout(timeoutId);
  }, [queryB]);

  const handleSelectDeviceA = (device: Device) => {
    setDeviceA(device);
    setQueryA(`${device.brand.raw} ${device.name.raw}`);
    setShowSuggestionsA(false);
  };

  const handleSelectDeviceB = (device: Device) => {
    setDeviceB(device);
    setQueryB(`${device.brand.raw} ${device.name.raw}`);
    setShowSuggestionsB(false);
  };

  const handleCompare = () => {
    if (deviceA && deviceB) {
      onCompare(deviceA, deviceB);
    }
  };

  return (
    <Box bg={colors.backgroundCard} p={4} borderRadius="md" mb={4}>
      <VStack space={3}>
        <Text fontSize="lg" fontWeight="bold" color={colors.textPrimary} textAlign="center">
          Compare Devices
        </Text>

        {/* Device A Input */}
        <Box>
          <Text fontSize="sm" color={colors.textSecondary} mb={2}>
            Device A
          </Text>
          <Box position="relative">
            <Box
              bg={colors.backgroundElevated}
              borderWidth={1}
              borderColor={isFocusedA ? colors.primary : colors.border}
              borderRadius="md"
              px={3}
              py={2}
            >
              <TextInput
                placeholder="Search for first device..."
                placeholderTextColor={colors.textTertiary}
                value={queryA}
                onChangeText={setQueryA}
                onFocus={() => {
                  setIsFocusedA(true);
                  setShowSuggestionsA(queryA.length > 0);
                }}
                onBlur={() => setIsFocusedA(false)}
                style={{
                  color: colors.textPrimary,
                  fontSize: 14,
                  padding: 0,
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </Box>
            {showSuggestionsA && suggestionsA.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                mt={1}
                bg={colors.backgroundCard}
                borderWidth={1}
                borderColor={colors.border}
                borderRadius="md"
                zIndex={10}
                maxHeight={200}
              >
                {suggestionsA.map((device) => (
                  <Pressable
                    key={device.id}
                    onPress={() => handleSelectDeviceA(device)}
                    p={3}
                    borderBottomWidth={1}
                    borderBottomColor={colors.border}
                  >
                    <Text color={colors.textPrimary} fontSize="sm">
                      {device.brand.raw} {device.name.raw}
                    </Text>
                  </Pressable>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Device B Input */}
        <Box>
          <Text fontSize="sm" color={colors.textSecondary} mb={2}>
            Device B
          </Text>
          <Box position="relative">
            <Box
              bg={colors.backgroundElevated}
              borderWidth={1}
              borderColor={isFocusedB ? colors.primary : colors.border}
              borderRadius="md"
              px={3}
              py={2}
            >
              <TextInput
                placeholder="Search for second device..."
                placeholderTextColor={colors.textTertiary}
                value={queryB}
                onChangeText={setQueryB}
                onFocus={() => {
                  setIsFocusedB(true);
                  setShowSuggestionsB(queryB.length > 0);
                }}
                onBlur={() => setIsFocusedB(false)}
                style={{
                  color: colors.textPrimary,
                  fontSize: 14,
                  padding: 0,
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </Box>
            {showSuggestionsB && suggestionsB.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                mt={1}
                bg={colors.backgroundCard}
                borderWidth={1}
                borderColor={colors.border}
                borderRadius="md"
                zIndex={10}
                maxHeight={200}
              >
                {suggestionsB.map((device) => (
                  <Pressable
                    key={device.id}
                    onPress={() => handleSelectDeviceB(device)}
                    p={3}
                    borderBottomWidth={1}
                    borderBottomColor={colors.border}
                  >
                    <Text color={colors.textPrimary} fontSize="sm">
                      {device.brand.raw} {device.name.raw}
                    </Text>
                  </Pressable>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* Compare Button */}
        <Button
          onPress={handleCompare}
          bg={colors.primary}
          size="md"
          isDisabled={!deviceA || !deviceB}
          _pressed={{ bg: colors.primaryHover }}
        >
          <Text color={colors.primaryContrast}>Compare</Text>
        </Button>
      </VStack>
    </Box>
  );
}
