import React from 'react';
import { VStack, HStack, Button, Text, Box, Spinner } from 'native-base';
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
            <Text color={colors.primary} fontSize="xs">First</Text>
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
            <Text color={colors.primary} fontSize="xs">Previous</Text>
          </Button>
          
          <Box minW={110} alignItems="center" justifyContent="center">
            {isLoading ? (
              <Spinner size="sm" color={colors.primary} />
            ) : (
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
            <Text color={colors.primary} fontSize="xs">Next</Text>
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
            <Text color={colors.primary} fontSize="xs">Last</Text>
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}
