import React from 'react';
import { HStack, Button, Text, Box, Spinner } from 'native-base';
import { colors } from '../../theme/colors';

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
      <HStack space={1.5} justifyContent="center" alignItems="center">
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
          <Text color={colors.primary} fontSize="xs">Previous</Text>
        </Button>
        
        <Text color={colors.textPrimary} fontSize="xs" px={2}>
          Page {pageNumber} of {totalPages}
        </Text>

        {isLoading && <Spinner size="sm" color={colors.primary} />}
        
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
          <Text color={colors.primary} fontSize="xs">Next</Text>
        </Button>
      </HStack>
    </Box>
  );
}
