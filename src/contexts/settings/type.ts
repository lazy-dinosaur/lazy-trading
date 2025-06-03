import { createContext } from "react";
import { TradingConfigType } from "@/lib/trading-config";

// 테마 타입 정의
export type ThemeType = "light" | "dark" | "system";

// 테마 설정 컨텍스트 타입
export interface SettingsContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

// 트레이딩 설정 컨텍스트 타입
export interface TradingConfigContextType {
  config?: TradingConfigType;
  updateConfig: (setting: Partial<TradingConfigType>) => void;
  isLoading: boolean;
}

// 컨텍스트 생성
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
export const TradingConfigContext = createContext<TradingConfigContextType | null>(null);

// 로컬스토리지 키 상수
export const THEME_KEY = "lazy-trading-theme";