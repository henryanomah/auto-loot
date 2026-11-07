"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { ClusterMoniker } from "../lib/solana-client";
import { getExplorerUrl } from "../lib/explorer";

export const CLUSTERS: ClusterMoniker[] = ["devnet"];

type ClusterContextValue = {
  cluster: ClusterMoniker;
  setCluster: (cluster: ClusterMoniker) => void;
  getExplorerUrl: (path: string) => string;
};

const defaultExplorerUrl = (path: string) => getExplorerUrl(path, "devnet");

const ClusterContext = createContext<ClusterContextValue>({
  cluster: "devnet",
  setCluster: () => {},
  getExplorerUrl: defaultExplorerUrl,
});

export function ClusterProvider({ children }: { children: ReactNode }) {
  const value: ClusterContextValue = {
    cluster: "devnet",
    setCluster: () => {},
    getExplorerUrl: defaultExplorerUrl,
  };

  return (
    <ClusterContext.Provider value={value}>
      {children}
    </ClusterContext.Provider>
  );
}

export function useCluster() {
  return useContext(ClusterContext);
}
