import React, { useEffect, useState } from "react";
import { Box, Button, HStack, Pressable, Text, VStack } from "native-base";
import { colors } from "../../theme/colors";

interface DeviceSearchFormProps {
  initialCategory?: "all" | "low" | "mid" | "high";
  initialSort?: string;
  initialFilter?: "all" | "upcoming" | "personal-picks";
  onSearch: (params: {
    query: string;
    category: "all" | "low" | "mid" | "high";
    sortBy: string;
    filter: "all" | "upcoming" | "personal-picks";
  }) => void;
}

const sortOptions = [
  { label: "New Arrivals", value: "new-arrivals" },
  { label: "Highly Ranked", value: "highly-ranked" },
  { label: "Price: Low to High", value: "low-high-price" },
  { label: "Price: High to Low", value: "high-low-price" },
  { label: "Alphabetical", value: "alphabetical" },
];

const filterOptions = [
  { label: "All Devices", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Personal Picks", value: "personal-picks" },
];

export function DeviceSearchForm({
  initialCategory = "all",
  initialSort = "all",
  initialFilter = "all",
  onSearch,
}: DeviceSearchFormProps) {
  const [category, setCategory] = useState<"all" | "low" | "mid" | "high">(
    initialCategory,
  );
  const [sortBy, setSortBy] = useState(initialSort);
  const [filter, setFilter] = useState<"all" | "upcoming" | "personal-picks">(
    initialFilter,
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-trigger search when any filter changes
  useEffect(() => {
    onSearch({ query: "", category, sortBy, filter });
  }, [category, sortBy, filter]);

  const getSortLabel = () => {
    return sortOptions.find((opt) => opt.value === sortBy)?.label || "Sort By";
  };

  const getFilterLabel = () => {
    return filterOptions.find((opt) => opt.value === filter)?.label || "Filter";
  };

  return (
    <Box bg={colors.backgroundCard} p={4} borderRadius="md" mb={4}>
      <VStack space={2}>
        {/* Toggle Button */}
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          bg={colors.backgroundElevated}
          borderWidth={1}
          borderColor={colors.border}
          borderRadius="md"
          p={3}
        >
          <HStack justifyContent="space-between" alignItems="center">
            <Text
              color={colors.textPrimary}
              fontSize="sm"
              fontWeight="semibold"
            >
              More Filters
            </Text>
            <Text color={colors.primary} fontSize="sm">
              {isExpanded ? "▲" : "▼"}
            </Text>
          </HStack>
        </Pressable>

        {/* Filters Content - Collapsible */}
        {isExpanded && (
          <VStack space={3} mt={2}>
            {/* Category - Button Group */}
            <Box>
              <Text fontSize="xs" color={colors.textSecondary} mb={2}>
                Price Range
              </Text>
              <HStack space={2}>
                <Button
                  flex={1}
                  size="sm"
                  variant={category === "all" ? "solid" : "outline"}
                  bg={category === "all" ? colors.primary : "transparent"}
                  borderColor={colors.primary}
                  onPress={() => setCategory("all")}
                >
                  <Text
                    color={category === "all"
                      ? colors.primaryContrast
                      : colors.primary}
                    fontSize="sm"
                  >
                    All
                  </Text>
                </Button>
                <Button
                  flex={1}
                  size="sm"
                  variant={category === "low" ? "solid" : "outline"}
                  bg={category === "low" ? colors.success : "transparent"}
                  borderColor={colors.success}
                  onPress={() => setCategory("low")}
                >
                  <Text
                    color={category === "low"
                      ? colors.textPrimary
                      : colors.success}
                    fontSize="sm"
                  >
                    $
                  </Text>
                </Button>
                <Button
                  flex={1}
                  size="sm"
                  variant={category === "mid" ? "solid" : "outline"}
                  bg={category === "mid" ? colors.primary : "transparent"}
                  borderColor={colors.primary}
                  onPress={() => setCategory("mid")}
                >
                  <Text
                    color={category === "mid"
                      ? colors.primaryContrast
                      : colors.primary}
                    fontSize="sm"
                  >
                    $$
                  </Text>
                </Button>
                <Button
                  flex={1}
                  size="sm"
                  variant={category === "high" ? "solid" : "outline"}
                  bg={category === "high" ? colors.error : "transparent"}
                  borderColor={colors.error}
                  onPress={() => setCategory("high")}
                >
                  <Text
                    color={category === "high"
                      ? colors.textPrimary
                      : colors.error}
                    fontSize="sm"
                  >
                    $$$
                  </Text>
                </Button>
              </HStack>
            </Box>

            {/* Sort - Button with Menu */}
            <Box>
              <Text fontSize="xs" color={colors.textSecondary} mb={2}>
                Sort By
              </Text>
              <Pressable
                onPress={() => setShowSortMenu(!showSortMenu)}
                bg={colors.backgroundElevated}
                borderWidth={1}
                borderColor={colors.border}
                borderRadius="md"
                p={3}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Text color={colors.textPrimary} fontSize="sm">
                    {getSortLabel()}
                  </Text>
                  <Text color={colors.primary} fontSize="sm">
                    ▼
                  </Text>
                </HStack>
              </Pressable>
              {showSortMenu && (
                <Box
                  mt={2}
                  bg={colors.backgroundElevated}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={colors.border}
                >
                  <VStack>
                    {sortOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        p={3}
                        borderBottomWidth={sortOptions.indexOf(option) <
                            sortOptions.length - 1
                          ? 1
                          : 0}
                        borderBottomColor={colors.border}
                      >
                        <Text
                          color={sortBy === option.value
                            ? colors.primary
                            : colors.textPrimary}
                          fontSize="sm"
                          fontWeight={sortBy === option.value
                            ? "bold"
                            : "normal"}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </VStack>
                </Box>
              )}
            </Box>

            {/* Filter - Button with Menu */}
            <Box>
              <Text fontSize="xs" color={colors.textSecondary} mb={2}>
                Filter
              </Text>
              <Pressable
                onPress={() => setShowFilterMenu(!showFilterMenu)}
                bg={colors.backgroundElevated}
                borderWidth={1}
                borderColor={colors.border}
                borderRadius="md"
                p={3}
              >
                <HStack justifyContent="space-between" alignItems="center">
                  <Text color={colors.textPrimary} fontSize="sm">
                    {getFilterLabel()}
                  </Text>
                  <Text color={colors.primary} fontSize="sm">
                    ▼
                  </Text>
                </HStack>
              </Pressable>
              {showFilterMenu && (
                <Box
                  mt={2}
                  bg={colors.backgroundElevated}
                  borderRadius="md"
                  borderWidth={1}
                  borderColor={colors.border}
                >
                  <VStack>
                    {filterOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => {
                          setFilter(option.value as typeof filter);
                          setShowFilterMenu(false);
                        }}
                        p={3}
                        borderBottomWidth={filterOptions.indexOf(option) <
                            filterOptions.length - 1
                          ? 1
                          : 0}
                        borderBottomColor={colors.border}
                      >
                        <Text
                          color={filter === option.value
                            ? colors.primary
                            : colors.textPrimary}
                          fontSize="sm"
                          fontWeight={filter === option.value
                            ? "bold"
                            : "normal"}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </VStack>
                </Box>
              )}
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
