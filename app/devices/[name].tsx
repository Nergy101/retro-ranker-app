import React, { useState, useEffect } from 'react';
import { ScrollView, Box, VStack, HStack, Text, Image, Spinner, Center, Button } from 'native-base';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Dimensions, StyleSheet, View } from 'react-native';
import { DeviceService, getDeviceImageUrl } from '../../services/devices/device.service';
import { Device } from '../../types/device.model';
import { DeviceCard } from '../../components/cards/DeviceCard';
import { TagComponent } from '../../components/shared/TagComponent';
import { EmulationCapabilities } from '../../components/devices/EmulationCapabilities';
import { SpecSummary } from '../../components/specifications/SpecSummary';
import { FullSpecs } from '../../components/specifications/FullSpecs';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  cardWrapper: {
    height: 280,
  },
});

export default function DeviceDetailPage() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const [device, setDevice] = useState<Device | null>(null);
  const [similarDevices, setSimilarDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const deviceService = DeviceService.getInstance();
  
  // Calculate card width for 2-column grid with gaps (same as home page)
  const cardGap = 12;
  const horizontalPadding = 16;
  const availableWidth = screenWidth - (horizontalPadding * 2);
  const cardWidth = Math.floor((availableWidth - cardGap) / 2);

  useEffect(() => {
    if (name) {
      loadDevice();
    }
  }, [name]);

  const loadDevice = async () => {
    try {
      setLoading(true);
      const [deviceData, similar] = await Promise.all([
        deviceService.getDeviceByName(name!),
        deviceService.getSimilarDevices(name!, 4),
      ]);

      if (!deviceData) {
        setError('Device not found');
        return;
      }

      setDevice(deviceData);
      setSimilarDevices(similar);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load device');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size={8} color={colors.primary} />
        <Text color={colors.textSecondary} mt={4}>Loading device...</Text>
      </Center>
    );
  }

  if (error || !device) {
    return (
      <Center flex={1} bg={colors.background}>
        <Text color={colors.error}>{error || 'Device not found'}</Text>
        <Button mt={4} onPress={() => router.back()} bg={colors.primary} size="md">
          Go Back
        </Button>
      </Center>
    );
  }

  const imageUrl = getDeviceImageUrl(device);

  return (
    <Box flex={1} bg={colors.background}>
      <ScrollView>
        <VStack space={4} p={4}>
          {/* Device Image */}
          <Box>
            <Image
              source={{ uri: imageUrl }}
              alt={device.name.raw}
              width="full"
              height={300}
              resizeMode="contain"
              bg={colors.backgroundElevated}
              borderRadius="md"
            />
          </Box>

          {/* Device Name and Brand */}
          <VStack space={2}>
            <Text fontSize="3xl" fontWeight="bold" color={colors.textPrimary}>
              {device.brand.raw} {device.name.raw}
            </Text>
            {device.pricing.average && (
              <Text fontSize="lg" color={colors.primary} fontWeight="semibold">
                {device.pricing.currency} {device.pricing.average}
              </Text>
            )}
          </VStack>

          {/* Tags */}
          {device.tags && device.tags.length > 0 && (
            <Box>
              <HStack space={1.5} flexWrap="wrap">
                {device.tags.map((tag) => (
                  <TagComponent
                    key={tag.id}
                    tag={tag}
                    size="xs"
                  />
                ))}
              </HStack>
            </Box>
          )}

          {/* Emulation Capabilities */}
          <EmulationCapabilities device={device} />

          {/* Spec Summary */}
          <SpecSummary device={device} />

          {/* Full Specifications */}
          <FullSpecs device={device} />

          {/* Cons */}
          {device.cons.length > 0 && (
            <Box bg={colors.backgroundCard} p={4} borderRadius="md">
              <Text fontSize="lg" fontWeight="bold" color={colors.error} mb={2}>
                Cons
              </Text>
              <VStack space={1}>
                {device.cons.map((con, idx) => (
                  <Text key={idx} color={colors.textPrimary} fontSize="sm">
                    • {con}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}

          {/* Similar Devices */}
          {similarDevices.length > 0 && (
            <Box>
              <Text fontSize="xl" fontWeight="bold" color={colors.textPrimary} mb={4}>
                Similar Devices
              </Text>
              <View style={styles.gridContainer}>
                {similarDevices.map((similarDevice, index) => {
                  const isLeftColumn = index % 2 === 0;
                  return (
                    <View
                      key={similarDevice.id}
                      style={[
                        styles.cardWrapper,
                        {
                          width: cardWidth,
                          marginRight: isLeftColumn ? cardGap : 0,
                          marginBottom: cardGap,
                        }
                      ]}
                    >
                      <DeviceCard
                        device={similarDevice}
                        onPress={() => router.push(`/devices/${similarDevice.name.sanitized}`)}
                      />
                    </View>
                  );
                })}
              </View>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
}
