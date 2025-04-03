import React, { ReactNode } from "react";
import { SettingsContext, ThemeType, TradingConfigContext, THEME_KEY } from "./type";
import { useFetchTradingConfig, useMutateTradingConfig } from "@/hooks/trading-config";

// 트레이딩 설정 프로바이더
export const TradingConfigProvider = ({ children }: { children: ReactNode }) => {
  const tradingConfigQuery = useFetchTradingConfig();
  const tradingConfigMutation = useMutateTradingConfig();

  return (
    <TradingConfigContext.Provider
      value={{
        config: tradingConfigQuery.data,
        updateConfig: (setting) => tradingConfigMutation.mutate(setting),
        isLoading:
          tradingConfigQuery.isLoading || tradingConfigMutation.isPending,
      }}
    >
      {children}
    </TradingConfigContext.Provider>
  );
};

// 테마 설정 프로바이더
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = React.useState<ThemeType>(() => {
    // 로컬스토리지에서 테마 설정 불러오기
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_KEY) as ThemeType;
      return savedTheme || "system";
    }
    return "system";
  });

  // 테마 변경 함수
  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_KEY, newTheme);
    }
  };

  // 테마 적용 효과
  React.useEffect(() => {
    const applyTheme = () => {
      const isDark = 
        theme === "dark" || 
        (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      
      document.documentElement.classList.toggle("dark", isDark);
    };

    applyTheme();

    // 시스템 테마 변경 감지
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme }}>
      {children}
    </SettingsContext.Provider>
  );
};