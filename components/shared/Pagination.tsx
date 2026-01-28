import React from "react";
import { Box, Button, HStack, Spinner, Text, VStack } from "native-base";
import { Feather } from "@expo/vector-icons";
import { colors } from "../../theme/colors";

interface PaginationProps {
  pageNumber: number;
  pageSize: number;
  totalResults: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  pageNumber,
  pageSize,
  totalResults,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  const totalPages = Math.ceil(totalResults / pageSize);
  const hasPrevious = pageNumber > 1;
  const hasNext = pageNumber < totalPages;

  if (totalPages <= 1) return null;

  return (
    <Box bg={colors.backgroundCard} p={2} borderRadius="md" mb={2}>
      <VStack space={1} alignItems="center">
        <HStack space={1.5} justifyContent="center" alignItems="center">
          <Button
            onPress={() => onPageChange(1)}
            isDisabled={!hasPrevious || isLoading}
            variant="outline"
            size="sm"
            borderColor={colors.primary}
            px={3}
            py={1.5}
            _disabled={{ opacity: 0.5 }}
          >
            <Feather name="skip-back" size={16} color={colors.primary} />
          </Button>

          <Button
            onPress={() => onPageChange(pageNumber - 1)}
            isDisabled={!hasPrevious || isLoading}
            variant="outline"
            size="sm"
            borderColor={colors.primary}
            px={3}
            py={1.5}
            _disabled={{ opacity: 0.5 }}
          >
            <Feather name="chevron-left" size={16} color={colors.primary} />
          </Button>

          <Box minW={110} alignItems="center" justifyContent="center">
            {isLoading
              ? <Spinner size="sm" color={colors.primary} />
              : (
                <Text color={colors.textPrimary} fontSize="xs" px={2}>
                  Page {pageNumber} of {totalPages}
                </Text>
              )}
          </Box>

          <Button
            onPress={() => onPageChange(pageNumber + 1)}
            isDisabled={!hasNext || isLoading}
            variant="outline"
            size="sm"
            borderColor={colors.primary}
            px={3}
            py={1.5}
            _disabled={{ opacity: 0.5 }}
          >
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </Button>

          <Button
            onPress={() => onPageChange(totalPages)}
            isDisabled={!hasNext || isLoading}
            variant="outline"
            size="sm"
            borderColor={colors.primary}
            px={3}
            py={1.5}
            _disabled={{ opacity: 0.5 }}
          >
            <Feather name="skip-forward" size={16} color={colors.primary} />
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
