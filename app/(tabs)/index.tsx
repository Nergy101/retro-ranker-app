import React, { useState, useEffect } from 'react';
import { ScrollView, Box, VStack, HStack, Text, Spinner, Center, Button, Image, Input, Pressable } from 'native-base';
import { Dimensions, StyleSheet, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { DeviceService } from '../../services/devices/device.service';
import { Device } from '../../types/device.model';
import { TagModel } from '../../types/tag.model';
import { DeviceCard } from '../../components/cards/DeviceCard';
import { DeviceSearchForm } from '../../components/forms/DeviceSearchForm';
import { Pagination } from '../../components/shared/Pagination';
import { TagComponent } from '../../components/shared/TagComponent';
import { colors } from '../../theme/colors';
import { useRouter } from 'expo-router';

export default function HomePage() {
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const insets = useSafeAreaInsets();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10; // Fixed page size for 2-column grid layout
  const [totalResults, setTotalResults] = useState(0);
  
  // Calculate card width for 2-column grid with gaps
  // Screen width - padding (32px total) - gap between cards (12px) = available width
  // Divide by 2 for 2 columns
  const cardGap = 12;
  const horizontalPadding = 16; // 16px on each side (from VStack p={4})
  const totalPadding = horizontalPadding * 2; // 32px total
  const availableWidth = screenWidth - totalPadding;
  const cardWidth = Math.floor((availableWidth - cardGap) / 2);
  
  // Ensure cardWidth is valid
  const safeCardWidth = cardWidth > 0 ? cardWidth : 150;
  
  const [searchParams, setSearchParams] = useState({
    query: '',
    category: 'all' as 'all' | 'low' | 'mid' | 'high',
    sortBy: 'all',
    filter: 'all' as 'all' | 'upcoming' | 'personal-picks',
  });
  const [selectedTags, setSelectedTags] = useState<TagModel[]>([]);
  const [allTags, setAllTags] = useState<TagModel[]>([]);
  const [popularTags, setPopularTags] = useState<TagModel[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const deviceService = DeviceService.getInstance();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    // Debounce search query to avoid too many API calls
    const timeoutId = setTimeout(() => {
      searchDevices();
    }, searchParams.query ? 300 : 0); // 300ms delay for query, immediate for other changes

    return () => clearTimeout(timeoutId);
  }, [pageNumber, searchParams, selectedTags]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [tags, newArrivals] = await Promise.all([
        deviceService.getAllTags(),
        deviceService.getNewArrivals(5),
      ]);
      
      setAllTags(tags);
      
      // Set popular tags (same as web app)
      const popularTagSlugs = [
        'year-2024',
        'year-2025',
        'year-2026',
        'oled',
        'upcoming',
        'anbernic',
        'miyoo-bittboy',
        'ayaneo',
        'powkiddy',
        'clamshell',
        'horizontal',
        'vertical',
        'micro',
        'windows',
        'steam-os',
        'linux',
        'android',
        'personal-pick',
      ];
      
      const popularTagsPromises = popularTagSlugs.map(slug => 
        deviceService.getTagBySlug(slug)
      );
      const popularTagsResults = await Promise.all(popularTagsPromises);
      const popularTagsFiltered = popularTagsResults.filter(
        (tag): tag is TagModel => tag !== null
      );
      setPopularTags(popularTagsFiltered);
      
      // Load initial devices
      await searchDevices();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const searchDevices = async () => {
    try {
      setLoading(true);
      const result = await deviceService.searchDevices(
        searchParams.query,
        searchParams.category,
        searchParams.sortBy as any,
        searchParams.filter,
        selectedTags,
        pageNumber,
        pageSize,
      );
      
      // Filter out archived devices + ones with no image/pricing/release date
      const filteredDevices = result.page.filter((device) => {
        if (device.archived === true) return false;

        const hasImage = device.image?.pocketbaseUrl || device.image?.webpUrl;
        const hasPricing = device.pricing.average || device.pricing.range;
        const releaseDate = device.released?.raw?.toLowerCase() || '';
        const hasReleaseDate = releaseDate && 
          releaseDate !== 'unknown' && 
          !releaseDate.includes('upcoming') &&
          releaseDate.trim() !== '';
        
        // Exclude if both pricing and release date are unknown/missing
        // Keep device if it has image OR pricing OR release date
        if (!hasPricing && !hasReleaseDate) {
          return false; // Filter out if both price and release date are unknown
        }
        
        // Also filter out if no image (as before)
        return hasImage || hasPricing || hasReleaseDate;
      });
      
      setDevices(filteredDevices);
      setTotalResults(result.totalAmountOfResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search devices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (params: typeof searchParams) => {
    setSearchParams(params);
    setPageNumber(1);
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleDevicePress = (device: Device) => {
    router.push(`/devices/${device.name.sanitized}`);
  };

  const handleTagPress = (tag: TagModel) => {
    if (selectedTags.find(t => t.id === tag.id)) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setPageNumber(1);
  };

  // Swipe gesture handler for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onEnd((event) => {
      const swipeThreshold = 50;
      if (event.translationX > swipeThreshold) {
        // Swipe right - already on first tab (Home)
        // Could navigate to last tab (Profile) for circular navigation
        router.push('/(tabs)/profile');
      } else if (event.translationX < -swipeThreshold) {
        // Swipe left - go to next tab (Compare)
        router.push('/(tabs)/compare');
      }
    });

  if (loading && devices.length === 0) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size={8} color={colors.primary} />
        <Text color={colors.textSecondary} mt={4}>Loading devices...</Text>
      </Center>
    );
  }

  if (error) {
    return (
      <Center flex={1} bg={colors.background}>
        <Text color={colors.error}>{error}</Text>
        <Button mt={4} onPress={loadInitialData} bg={colors.primary} size="md">
          Retry
        </Button>
      </Center>
    );
  }

  return (
    <GestureDetector gesture={swipeGesture}>
      <Box flex={1} bg={colors.background}>
        <ScrollView>
          <VStack 
            space={2} 
            p={4}
            pt={Math.max(insets.top, 16)}
          >
          <Box mb={1}>
            <HStack space={2} alignItems="center">
              <Image
                source={{ uri: 'https://retroranker.site/logos/retro-ranker/rr-logo.png' }}
                alt="Retro Ranker Logo"
                width={16}
                height={16}
                resizeMode="contain"
              />
              <Text fontSize="xs" fontWeight="semibold" color={colors.textSecondary}>
                Retro Ranker
              </Text>
            </HStack>
          </Box>

          {/* Search Bar */}
          <Box mb={2}>
            <Box
              bg={colors.backgroundCard}
              borderWidth={1}
              borderColor={isSearchFocused ? colors.primary : colors.border}
              borderRadius="md"
              px={4}
              py={3}
              position="relative"
            >
              <HStack alignItems="center" space={2}>
                <TextInput
                  placeholder="Search devices by name or brand..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchParams.query}
                  onChangeText={(text) => {
                    setSearchParams({ ...searchParams, query: text });
                    setPageNumber(1);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  style={{
                    color: colors.textPrimary,
                    fontSize: 14,
                    padding: 0,
                    flex: 1,
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchParams.query.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setSearchParams({ ...searchParams, query: '' });
                      setPageNumber(1);
                    }}
                    p={1}
                  >
                    <Text fontSize="lg" color={colors.textSecondary}>
                      ×
                    </Text>
                  </Pressable>
                )}
              </HStack>
            </Box>
          </Box>

          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <Box py={1} px={2}>
              <Text fontSize="md" fontWeight="semibold" color={colors.textPrimary} mb={3}>
                Popular Searches
              </Text>
              <HStack space={1.5} flexWrap="wrap">
                {popularTags.map((tag) => (
                  <TagComponent
                    key={tag.id}
                    tag={tag}
                    onPress={() => handleTagPress(tag)}
                  />
                ))}
              </HStack>
            </Box>
          )}

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <Box py={3} px={2}>
              <Text fontSize="sm" color={colors.textSecondary} mb={3}>
                Selected Filters:
              </Text>
              <HStack space={1.5} flexWrap="wrap">
                {selectedTags.map((tag) => (
                  <TagComponent
                    key={tag.id}
                    tag={tag}
                    onPress={() => handleTagPress(tag)}
                  />
                ))}
              </HStack>
            </Box>
          )}

          {/* Search Form */}
          <DeviceSearchForm
            initialCategory={searchParams.category}
            initialSort={searchParams.sortBy}
            initialFilter={searchParams.filter}
            onSearch={handleSearch}
          />

          {/* Results Count */}
          <Text fontSize="sm" color={colors.textSecondary}>
            {totalResults} device{totalResults !== 1 ? 's' : ''} found
          </Text>

          {/* Pagination */}
          {totalResults > pageSize && (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalResults={totalResults}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          )}

          {/* Device List */}
          {devices.length === 0 ? (
            <Center py={10}>
              <Text color={colors.textTertiary}>
                No devices found matching your criteria.
              </Text>
            </Center>
          ) : (
            <View style={styles.gridContainer}>
              {devices.map((device, index) => {
                const isLeftColumn = index % 2 === 0;
                return (
                  <View
                    key={device.id}
                    style={[
                      styles.cardWrapper,
                      {
                        width: safeCardWidth,
                        marginRight: isLeftColumn ? cardGap : 0,
                        marginBottom: cardGap,
                      }
                    ]}
                  >
                    <DeviceCard
                      device={device}
                      onPress={() => handleDevicePress(device)}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Bottom Pagination */}
          {totalResults > pageSize && (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalResults={totalResults}
              onPageChange={handlePageChange}
              isLoading={loading}
            />
          )}
          </VStack>
        </ScrollView>
      </Box>
    </GestureDetector>
  );
}

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

