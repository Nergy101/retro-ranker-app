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

/**
 * Provides network state via Expo's expo-network when the native module is
 * available (development build). When running in Expo Go or before a native
 * rebuild, the native module is missing—we fall back to assuming online so
 * the app does not crash.
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const [state, setState] = useState<NetworkState>({
    isConnected: true,
    isInternetReachable: undefined,
  });

  useEffect(() => {
    let Network: typeof import("expo-network") | null = null;
    try {
      Network = require("expo-network");
    } catch {
      return;
    }
    if (!Network?.getNetworkStateAsync || !Network?.addNetworkStateListener) {
      return;
    }
    const applyState = (next: { isConnected?: boolean; isInternetReachable?: boolean }) => {
      setState((prev) => ({
        isConnected: next.isConnected ?? prev.isConnected,
        isInternetReachable: next.isInternetReachable ?? prev.isInternetReachable,
      }));
    };
    Network.getNetworkStateAsync()
      .then(applyState)
      .catch(() => {});
    const sub = Network.addNetworkStateListener?.(applyState);
    return () => {
      if (typeof sub?.remove === "function") sub.remove();
    };
  }, []);

  const value = useMemo(() => state, [state.isConnected, state.isInternetReachable]);

  return (
    <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
  );
}
