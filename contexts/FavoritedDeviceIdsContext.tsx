import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { DeviceCollectionService } from "../services/devices/device-collection.service";

interface FavoritedDeviceIdsContextType {
  favoritedDeviceIds: Set<string>;
  loading: boolean;
  refetch: () => Promise<void>;
}

const FavoritedDeviceIdsContext =
  createContext<FavoritedDeviceIdsContextType | undefined>(undefined);

export function FavoritedDeviceIdsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, authenticated } = useAuth();
  const [favoritedDeviceIds, setFavoritedDeviceIds] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);

  const loadIds = useCallback(async () => {
    if (!authenticated || !user?.id) {
      setFavoritedDeviceIds(new Set());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const service = DeviceCollectionService.getInstance();
      const ids = await service.getUserFavoritedDeviceIds(user.id);
      setFavoritedDeviceIds(new Set(ids));
    } catch (error) {
      console.error("Error loading favorited device IDs:", error);
      setFavoritedDeviceIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [authenticated, user?.id]);

  const refetch = useCallback(async () => {
    await loadIds();
  }, [loadIds]);

  useEffect(() => {
    loadIds();
  }, [loadIds]);

  const value: FavoritedDeviceIdsContextType = {
    favoritedDeviceIds,
    loading,
    refetch,
  };

  return (
    <FavoritedDeviceIdsContext.Provider value={value}>
      {children}
    </FavoritedDeviceIdsContext.Provider>
  );
}

export function useFavoritedDeviceIds(): FavoritedDeviceIdsContextType {
  const context = useContext(FavoritedDeviceIdsContext);
  if (context === undefined) {
    throw new Error(
      "useFavoritedDeviceIds must be used within a FavoritedDeviceIdsProvider",
    );
  }
  return context;
}
