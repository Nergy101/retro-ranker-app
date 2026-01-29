import { requireOptionalNativeModule } from "expo-modules-core";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | undefined;
}

const NetworkContext = createContext<NetworkState | undefined>(undefined);

export function useNetwork(): NetworkState {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

interface NetworkProviderProps {
  children: ReactNode;
}

/** Native module may expose getNetworkStateAsync and addListener. */
interface ExpoNetworkModule {
  getNetworkStateAsync?: () => Promise<{
    isConnected?: boolean;
    isInternetReachable?: boolean;
  }>;
  addListener?: (
    event: string,
    listener: (payload: { isConnected?: boolean; isInternetReachable?: boolean }) => void
  ) => { remove: () => void };
}

const NETWORK_STATE_EVENT = "onNetworkStateChanged";

/**
 * Provides network state via Expo's expo-network when the native module is
 * available (development build). When the native module is missing (e.g. Expo Go
 * or a dev client built before expo-network was added), we fall back to
 * assuming online so the app does not crash.
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: undefined,
  });

  useEffect(() => {
    const ExpoNetwork = requireOptionalNativeModule<ExpoNetworkModule>("ExpoNetwork");
    if (
      !ExpoNetwork?.getNetworkStateAsync ||
      !ExpoNetwork?.addListener
    ) {
      return;
    }
    const applyState = (next: { isConnected?: boolean; isInternetReachable?: boolean }) => {
      setState((prev) => ({
        isConnected: next.isConnected ?? prev.isConnected,
        isInternetReachable: next.isInternetReachable ?? prev.isInternetReachable,
      }));
    };
    ExpoNetwork.getNetworkStateAsync()
      .then(applyState)
      .catch(() => {});
    const sub = ExpoNetwork.addListener(NETWORK_STATE_EVENT, applyState);
    return () => {
      if (typeof sub?.remove === "function") sub.remove();
    };
  }, []);

  const value = useMemo(() => state, [state.isConnected, state.isInternetReachable]);

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}
