import { createContext } from "react";

export interface AppState {
  currentRoute: string | null;
  data: Record<string, any>;
}

export interface CacheContextType {
  cache: AppState | undefined;
  isLoading: boolean;
  error: Error | null;
  updateCache: (newState: Partial<AppState>) => Promise<void>;
}

export const CacheContext = createContext<CacheContextType | undefined>(
  undefined,
);
