import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import {
  Box,
  Button,
  Center,
  HStack,
  Input,
  Pressable,
  ScrollView,
  Spinner,
  Text,
  VStack,
} from "native-base";
import {
  Dimensions,
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useNetwork } from "../../contexts/NetworkContext";
import { useFavoritedDeviceIds } from "../../hooks/useFavoritedDeviceIds";
import { DeviceService } from "../../services/devices/device.service";
import { Device } from "../../types/device.model";
import { TagModel } from "../../types/tag.model";
import { DeviceCard } from "../../components/cards/DeviceCard";
import { DeviceSearchForm } from "../../components/forms/DeviceSearchForm";
import { Pagination } from "../../components/shared/Pagination";
import { TagComponent } from "../../components/shared/TagComponent";
import { RateLimitError } from "../../components/errors/RateLimitError";
import { colors } from "../../theme/colors";
import { SAFE_AREA_TOP_PADDING_MIN } from "../../utils/constants";
import { getErrorMessage, getRateLimitInfo } from "../../utils/error-utils";
import { ClientResponseError } from "pocketbase";
import {
  useFocusEffect,
  useGlobalSearchParams,
  useLocalSearchParams,
  useRouter,
} from "expo-router";

export default function SearchPage() {
  const router = useRouter();
  const { isConnected } = useNetwork();
  const { favoritedDeviceIds } = useFavoritedDeviceIds();
  const localParams = useLocalSearchParams<{
    tagId?: string | string[];
    sortBy?: string | string[];
    category?: string | string[];
  }>();
  const globalParams = useGlobalSearchParams<{
    tagId?: string | string[];
    sortBy?: string | string[];
    category?: string | string[];
  }>();
  // Use global params for cross-route navigation, fallback to local
  const tagIdParam = globalParams.tagId || localParams.tagId;
  const sortByParam = globalParams.sortBy || localParams.sortBy;
  const categoryParam = globalParams.category || localParams.category;
  const params = {
    tagId: Array.isArray(tagIdParam) ? tagIdParam[0] : tagIdParam,
    sortBy: Array.isArray(sortByParam) ? sortByParam[0] : sortByParam,
    category: Array.isArray(categoryParam) ? categoryParam[0] : categoryParam,
  };
  const screenWidth = Dimensions.get("window").width;
  const insets = useSafeAreaInsets();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitError, setRateLimitError] = useState<
    {
      retryAfterMinutes: number;
    } | null
  >(null);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10; // Fixed page size for 2-column grid layout
  const [totalResults, setTotalResults] = useState(0);
  const [isCached, setIsCached] = useState(false);

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
    query: "",
    category: (params.category || "all") as "all" | "low" | "mid" | "high",
    sortBy: params.sortBy || "all",
    filter: "all" as "all" | "upcoming" | "personal-picks",
  });
  const [selectedTags, setSelectedTags] = useState<TagModel[]>([]);
  const [allTags, setAllTags] = useState<TagModel[]>([]);
  const [popularTags, setPopularTags] = useState<TagModel[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isTagSearchFocused, setIsTagSearchFocused] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const dropdownRef = useRef<View>(null);
  const isClickingDropdownRef = useRef(false);

  const deviceService = DeviceService.getInstance();

  useEffect(() => {
    loadInitialData();
    // Check for tagId from AsyncStorage (set when navigating from device detail)
    checkStoredTagId();
    // Load saved search query
    loadSavedSearchQuery();
  }, [isConnected]);

  const loadSavedSearchQuery = async () => {
    try {
      const savedQuery = await AsyncStorage.getItem("searchQuery");
      if (savedQuery) {
        setSearchParams((prev) => ({ ...prev, query: savedQuery }));
      }
    } catch (error) {
      console.error("Error loading saved search query:", error);
    }
  };

  const checkStoredTagId = async () => {
    try {
      const storedTagId = await AsyncStorage.getItem("selectedTagId");
      if (storedTagId && allTags.length > 0) {
        // Try to find by id first, then by slug as fallback
        const tag = allTags.find((t) => t.id === storedTagId) ||
          allTags.find((t) => t.slug === storedTagId);
        if (tag) {
          setSelectedTags([tag]);
          setPageNumber(1);
          // Clear the stored tagId after using it
          await AsyncStorage.removeItem("selectedTagId");
        }
      }
    } catch (error) {
      console.error("Error reading stored tagId:", error);
    }
  };

  // Handle sortBy parameter changes
  useEffect(() => {
    const sortBy = Array.isArray(params.sortBy)
      ? params.sortBy[0]
      : params.sortBy;
    if (sortBy) {
      setSearchParams((prev) => ({ ...prev, sortBy }));
      setPageNumber(1);
    }
  }, [params.sortBy]);

  // Handle category parameter changes
  useEffect(() => {
    const category = Array.isArray(params.category)
      ? params.category[0]
      : params.category;
    if (category) {
      setSearchParams((prev) => ({
        ...prev,
        category: category as "all" | "low" | "mid" | "high",
      }));
      setPageNumber(1);
    }
  }, [params.category]);

  // Resolve tag by id or slug (device detail may pass either)
  const findTagByIdOrSlug = (tagId: string) =>
    allTags.find((t) => t.id === tagId) ||
    allTags.find((t) => t.slug === tagId);

  // Handle tagId when allTags loads (check both params and AsyncStorage)
  useEffect(() => {
    // Handle tagId as string or array (Expo Router can return either)
    const tagId = Array.isArray(params.tagId) ? params.tagId[0] : params.tagId;
    if (tagId && allTags.length > 0) {
      const tag = findTagByIdOrSlug(tagId);
      if (tag) {
        // Always set the tag when tagId param is present (replace any existing selections)
        setSelectedTags([tag]);
        setPageNumber(1);
      }
    } else if (allTags.length > 0) {
      // If no params tagId, check AsyncStorage
      checkStoredTagId();
    }
  }, [params.tagId, allTags]);

  // Handle sortBy when screen comes into focus (for navigation from other screens)
  useFocusEffect(
    React.useCallback(() => {
      const sortBy = Array.isArray(params.sortBy)
        ? params.sortBy[0]
        : params.sortBy;
      if (sortBy) {
        setSearchParams((prev) => ({ ...prev, sortBy }));
        setPageNumber(1);
      }
    }, [params.sortBy]),
  );

  // Handle category when screen comes into focus (for navigation from other screens)
  useFocusEffect(
    React.useCallback(() => {
      const category = Array.isArray(params.category)
        ? params.category[0]
        : params.category;
      if (category) {
        setSearchParams((prev) => ({
          ...prev,
          category: category as "all" | "low" | "mid" | "high",
        }));
        setPageNumber(1);
      }
    }, [params.category]),
  );

  // Handle tagId when screen comes into focus (for navigation from other screens)
  useFocusEffect(
    React.useCallback(() => {
      // Handle tagId as string or array (Expo Router can return either)
      const tagId = Array.isArray(params.tagId)
        ? params.tagId[0]
        : params.tagId;
      if (tagId && allTags.length > 0) {
        const tag = findTagByIdOrSlug(tagId);
        if (tag) {
          // Always set the tag when tagId param is present (replace any existing selections)
          setSelectedTags([tag]);
          setPageNumber(1);
        }
      } else if (allTags.length > 0) {
        // If no params tagId, check AsyncStorage
        checkStoredTagId();
      }
    }, [params.tagId, allTags]),
  );

  useEffect(() => {
    // Debounce search query to avoid too many API calls
    const timeoutId = setTimeout(
      () => {
        searchDevices();
      },
      searchParams.query ? 300 : 0,
    ); // 300ms delay for query, immediate for other changes

    return () => clearTimeout(timeoutId);
  }, [pageNumber, searchParams, selectedTags]);

  // Save search query to AsyncStorage whenever it changes
  useEffect(() => {
    const saveSearchQuery = async () => {
      try {
        if (searchParams.query.trim()) {
          await AsyncStorage.setItem("searchQuery", searchParams.query);
        } else {
          await AsyncStorage.removeItem("searchQuery");
        }
      } catch (error) {
        console.error("Error saving search query:", error);
      }
    };

    // Debounce saving to avoid too many AsyncStorage writes
    const saveTimeoutId = setTimeout(saveSearchQuery, 500);
    return () => clearTimeout(saveTimeoutId);
  }, [searchParams.query]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setIsCached(false);

      if (!isConnected) {
        // Offline: load from cache
        const [tags, cachedDevices] = await Promise.all([
          deviceService.getCachedAllTagsAsync(),
          deviceService.getCachedAllDevicesAsync(),
        ]);
        setAllTags(tags ?? []);
        if (tags?.length) {
          const popularTagSlugs = [
            "year-2025",
            "year-2026",
            "upcoming",
            "oled",
            "micro",
            "personal-pick",
            "anbernic",
            "miyoo-bittboy",
            "ayaneo",
            "powkiddy",
            "clamshell",
            "horizontal",
            "vertical",
          ];
          const popularTagsFiltered = (tags ?? []).filter((tag) =>
            popularTagSlugs.includes(tag.slug)
          );
          setPopularTags(popularTagsFiltered);
        }
        if (cachedDevices?.length) {
          setDevices(cachedDevices.slice(0, pageSize));
          setTotalResults(cachedDevices.length);
          setIsCached(true);
        } else {
          setDevices([]);
          setTotalResults(0);
        }
        setRateLimitError(null);
        setError(null);
        setLoading(false);
        return;
      }

      const [tags, newArrivals] = await Promise.all([
        deviceService.getAllTags(),
        deviceService.getNewArrivals(5),
      ]);

      setAllTags(tags);

      // Handle tagId query parameter after tags are loaded (match by id or slug)
      const tagId = Array.isArray(params.tagId)
        ? params.tagId[0]
        : params.tagId;
      if (tagId) {
        const tag =
          tags.find((t) => t.id === tagId) || tags.find((t) => t.slug === tagId);
        if (tag) {
          setSelectedTags([tag]);
          setPageNumber(1);
        }
      }

      // Set popular tags (same as web app)
      const popularTagSlugs = [
        "year-2025",
        "year-2026",
        "upcoming",
        "oled",
        "personal-pick",
        "anbernic",
        "miyoo-bittboy",
        "ayaneo",
        "powkiddy",
        "clamshell",
        "horizontal",
        "vertical",
        "micro",
      ];

      const popularTagsPromises = popularTagSlugs.map((slug) =>
        deviceService.getTagBySlug(slug)
      );
      const popularTagsResults = await Promise.all(popularTagsPromises);
      const popularTagsFiltered = popularTagsResults.filter(
        (tag): tag is TagModel => tag !== null,
      );
      setPopularTags(popularTagsFiltered);

      // Load initial devices
      await searchDevices();
    } catch (err) {
      const rateLimitInfo = getRateLimitInfo(err);
      if (rateLimitInfo) {
        setRateLimitError({
          retryAfterMinutes: rateLimitInfo.retryAfterMinutes,
        });
        setError(null);
      } else {
        setError(getErrorMessage(err));
        setRateLimitError(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchDevices = async () => {
    try {
      setLoading(true);
      if (!isConnected) {
        const cached = await deviceService.getCachedAllDevicesAsync();
        if (cached?.length) {
          const start = (pageNumber - 1) * pageSize;
          setDevices(cached.slice(start, start + pageSize));
          setTotalResults(cached.length);
          setIsCached(true);
        }
        setLoading(false);
        return;
      }
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
        const releaseDate = device.released?.raw?.toLowerCase() || "";
        const hasReleaseDate = releaseDate &&
          releaseDate !== "unknown" &&
          !releaseDate.includes("upcoming") &&
          releaseDate.trim() !== "";

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
      // Clear any previous rate limit errors on successful search
      setRateLimitError(null);
      setError(null);
    } catch (err) {
      const rateLimitInfo = getRateLimitInfo(err);
      if (rateLimitInfo) {
        setRateLimitError({
          retryAfterMinutes: rateLimitInfo.retryAfterMinutes,
        });
        setError(null);
      } else {
        setError(getErrorMessage(err));
        setRateLimitError(null);
      }
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
    setSelectedTags((prevTags) => {
      if (prevTags.find((t) => t.id === tag.id)) {
        return prevTags.filter((t) => t.id !== tag.id);
      } else {
        // If adding a tag of type 'releaseDate' or 'formFactor', remove any existing tags of that type first
        const filteredTags =
          tag.type === "releaseDate" || tag.type === "formFactor"
            ? prevTags.filter((t) => t.type !== tag.type)
            : prevTags;
        return [...filteredTags, tag];
      }
    });
    setPageNumber(1);
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTags((prevTags) => prevTags.filter((t) => t.id !== tagId));
    setPageNumber(1);
  };

  // Filter tags based on search query (exclude already selected tags)
  const filteredTagsForSearch = useMemo(() => {
    if (!tagSearchQuery.trim()) return [];

    const query = tagSearchQuery.toLowerCase().trim();
    return allTags
      .filter((tag) => {
        // Exclude already selected tags
        if (selectedTags.some((t) => t.id === tag.id)) return false;
        // Filter by name or slug
        return tag.name.toLowerCase().includes(query) ||
          tag.slug.toLowerCase().includes(query);
      })
      .slice(0, 10); // Limit to 10 results
  }, [tagSearchQuery, allTags, selectedTags]);

  // Swipe gesture handler for tab navigation
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onEnd((event) => {
      const swipeThreshold = 50;
      if (event.translationX > swipeThreshold) {
        // Swipe right - go to previous tab (Home)
        router.push("/(tabs)/");
      } else if (event.translationX < -swipeThreshold) {
        // Swipe left - go to next tab (Compare)
        router.push("/(tabs)/compare");
      }
    });

  if (loading && devices.length === 0) {
    return (
      <Center flex={1} bg={colors.background}>
        <Spinner size={8} color={colors.primary} />
        <Text color={colors.textSecondary} mt={4}>
          Loading devices...
        </Text>
      </Center>
    );
  }

  if (rateLimitError) {
    return (
      <RateLimitError
        retryAfterMinutes={rateLimitError.retryAfterMinutes}
        onRetry={loadInitialData}
      />
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
            style={{ paddingTop: Math.max(insets.top, SAFE_AREA_TOP_PADDING_MIN) }}
          >
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
                  <Feather
                    name="search"
                    size={18}
                    color={colors.textTertiary}
                  />
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
                      onPress={async () => {
                        setSearchParams({ ...searchParams, query: "" });
                        setPageNumber(1);
                        // Clear saved query from AsyncStorage
                        try {
                          await AsyncStorage.removeItem("searchQuery");
                        } catch (error) {
                          console.error("Error clearing search query:", error);
                        }
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
                <Text
                  fontSize="md"
                  fontWeight="semibold"
                  color={colors.textPrimary}
                  mb={3}
                >
                  Popular Searches
                </Text>
                <Box
                  flexDirection="row"
                  flexWrap="wrap"
                  style={{ gap: 5 }}
                  alignItems="center"
                >
                  {popularTags.map((tag) => (
                    <TagComponent
                      key={tag.id}
                      tag={tag}
                      onPress={() => handleTagPress(tag)}
                      isSelected={selectedTags.some((t) => t.id === tag.id)}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Selected Filters Section */}
            <Box
              bg={colors.backgroundCard}
              borderRadius="md"
              borderWidth={1}
              borderColor={colors.border}
              p={4}
            >
              <VStack space={3}>
                <HStack justifyContent="space-between" alignItems="center">
                  <HStack alignItems="center" space={2}>
                    <Feather name="tag" size={18} color={colors.textPrimary} />
                    <Text
                      fontSize="md"
                      fontWeight="semibold"
                      color={colors.textPrimary}
                    >
                      Tag Filters
                    </Text>
                  </HStack>
                  {selectedTags.length > 0 && (
                    <Pressable
                      onPress={() => {
                        setSelectedTags([]);
                        setPageNumber(1);
                      }}
                    >
                      <Text fontSize="xs" color={colors.textTertiary}>
                        Clear All
                      </Text>
                    </Pressable>
                  )}
                </HStack>

                {/* Selected Tags */}
                {selectedTags.length > 0 && (
                  <VStack space={2}>
                    <Text fontSize="xs" color={colors.textSecondary}>
                      Selected ({selectedTags.length}):
                    </Text>
                    <HStack space={1.5} flexWrap="wrap">
                      {selectedTags.map((tag) => (
                        <TagComponent
                          key={tag.id}
                          tag={tag}
                          onPress={() => handleRemoveTag(tag.id)}
                          isSelected={true}
                          showRemoveIcon={true}
                          onRemove={() => handleRemoveTag(tag.id)}
                        />
                      ))}
                    </HStack>
                  </VStack>
                )}

                {/* Tag Search */}
                <VStack space={2}>
                  <Box
                    bg={colors.background}
                    borderWidth={1}
                    borderColor={isTagSearchFocused
                      ? colors.primary
                      : colors.border}
                    borderRadius="md"
                    px={3}
                    py={2}
                    position="relative"
                  >
                    <HStack alignItems="center" space={2}>
                      <Feather
                        name="search"
                        size={16}
                        color={isTagSearchFocused
                          ? colors.primary
                          : colors.textTertiary}
                      />
                      <TextInput
                        ref={(input) => {
                          // Store ref for programmatic focus control
                          if (input) {
                            (input as any)._tagInputRef = input;
                          }
                        }}
                        placeholder="Search tags..."
                        placeholderTextColor={colors.textTertiary}
                        value={tagSearchQuery}
                        onChangeText={(text) => {
                          setTagSearchQuery(text);
                          // Show dropdown when typing (if there will be results)
                          setShowTagDropdown(true);
                        }}
                        onFocus={() => {
                          setIsTagSearchFocused(true);
                          setShowTagDropdown(true);
                        }}
                        onBlur={() => {
                          // Don't close dropdown immediately - allow time for dropdown clicks
                          // Keep dropdown open if there are results
                          setTimeout(() => {
                            if (!isClickingDropdownRef.current) {
                              setIsTagSearchFocused(false);
                              // Only close dropdown if no search query or no results
                              if (
                                !tagSearchQuery.trim() ||
                                filteredTagsForSearch.length === 0
                              ) {
                                setShowTagDropdown(false);
                              }
                            }
                            isClickingDropdownRef.current = false;
                          }, 400);
                        }}
                        style={{
                          color: colors.textPrimary,
                          fontSize: 14,
                          padding: 0,
                          flex: 1,
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {tagSearchQuery.length > 0 && (
                        <Pressable
                          onPress={() => {
                            setTagSearchQuery("");
                            setShowTagDropdown(false);
                            setIsTagSearchFocused(false);
                          }}
                          p={1}
                        >
                          <Feather
                            name="x"
                            size={16}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      )}
                    </HStack>

                    {/* Tag Search Results Dropdown */}
                    {(showTagDropdown ||
                      (tagSearchQuery.trim().length > 0 &&
                        filteredTagsForSearch.length > 0)) &&
                      filteredTagsForSearch.length > 0 && (
                      <View
                        ref={dropdownRef}
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: 4,
                          zIndex: 1000,
                        }}
                        onStartShouldSetResponder={() => {
                          isClickingDropdownRef.current = true;
                          return true;
                        }}
                        onMoveShouldSetResponder={() => true}
                        onTouchStart={() => {
                          isClickingDropdownRef.current = true;
                        }}
                      >
                        <Box
                          bg={colors.backgroundCard}
                          borderWidth={1}
                          borderColor={colors.border}
                          borderRadius="md"
                          maxHeight={200}
                          shadow={2}
                        >
                          <ScrollView maxHeight={200}>
                            <VStack>
                              {filteredTagsForSearch.map((tag) => (
                                <TouchableOpacity
                                  key={tag.id}
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    // Mark that we're clicking the dropdown
                                    isClickingDropdownRef.current = true;
                                    // Add tag immediately
                                    setSelectedTags((prevTags) => {
                                      if (
                                        prevTags.find((t) => t.id === tag.id)
                                      ) {
                                        return prevTags;
                                      }
                                      // If adding a tag of type 'releaseDate' or 'formFactor', remove any existing tags of that type first
                                      const filteredTags =
                                        tag.type === "releaseDate" ||
                                          tag.type === "formFactor"
                                          ? prevTags.filter((t) =>
                                            t.type !== tag.type
                                          )
                                          : prevTags;
                                      return [...filteredTags, tag];
                                    });
                                    setPageNumber(1);
                                    setTagSearchQuery("");
                                    setShowTagDropdown(false);
                                    setIsTagSearchFocused(false);
                                    Keyboard.dismiss();
                                    // Reset flag after a delay
                                    setTimeout(() => {
                                      isClickingDropdownRef.current = false;
                                    }, 100);
                                  }}
                                >
                                  <Box
                                    p={3}
                                    borderBottomWidth={1}
                                    borderBottomColor={colors.border}
                                    bg="transparent"
                                  >
                                    <HStack
                                      justifyContent="space-between"
                                      alignItems="center"
                                    >
                                      <Text
                                        fontSize="sm"
                                        color={colors.textPrimary}
                                      >
                                        {tag.name}
                                      </Text>
                                      <Feather
                                        name="plus"
                                        size={16}
                                        color={colors.primary}
                                      />
                                    </HStack>
                                  </Box>
                                </TouchableOpacity>
                              ))}
                            </VStack>
                          </ScrollView>
                        </Box>
                      </View>
                    )}

                    {/* No results message */}
                    {(showTagDropdown || isTagSearchFocused) &&
                      tagSearchQuery.trim().length > 0 &&
                      filteredTagsForSearch.length === 0 && (
                      <View
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          marginTop: 4,
                          zIndex: 1000,
                        }}
                        onStartShouldSetResponder={() => true}
                      >
                        <Box
                          bg={colors.backgroundCard}
                          borderWidth={1}
                          borderColor={colors.border}
                          borderRadius="md"
                          p={3}
                        >
                          <Text
                            fontSize="sm"
                            color={colors.textTertiary}
                            textAlign="center"
                          >
                            No tags found matching "{tagSearchQuery}"
                          </Text>
                        </Box>
                      </View>
                    )}
                  </Box>
                </VStack>
              </VStack>
            </Box>

            {/* Search Form */}
            <DeviceSearchForm
              initialCategory={searchParams.category}
              initialSort={searchParams.sortBy}
              initialFilter={searchParams.filter}
              onSearch={handleSearch}
            />

            {/* Results Count */}
            <Box>
              <Text fontSize="sm" color={colors.textSecondary}>
                Found {totalResults} device{totalResults !== 1 ? "s" : ""}{" "}
                matching your criteria
              </Text>
              {isCached && (
                <Text fontSize="xs" color={colors.textTertiary} mt={0.5}>
                  Last updated when online
                </Text>
              )}
            </Box>

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
            {devices.length === 0
              ? (
                <Center py={10}>
                  <Text color={colors.textTertiary}>
                    No devices found matching your criteria.
                  </Text>
                </Center>
              )
              : (
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
                          },
                        ]}
                      >
                        <Box flex={1} height={250}>
                          <DeviceCard
                            device={device}
                            onPress={() => handleDevicePress(device)}
                            isFavorited={favoritedDeviceIds.has(device.id)}
                          />
                        </Box>
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
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  cardWrapper: {
    height: 280,
  },
});
