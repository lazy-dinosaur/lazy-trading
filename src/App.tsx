import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { usePin } from "./contexts/pin/use";
import { Toaster } from "@/components/ui/toaster";
import { LocationListener } from "./components/analytics/location-listener";
import { LanguageProvider } from "./contexts/language/LanguageContext";
import '@/lib/i18n'; // i18n 초기화를 위한 import

//초기 로딩과 초기 셋업 불러오기
//로딩 스크린 넣기

const App = () => {
  const [isLoaded, setIsloaded] = useState(false);
  const navigation = useNavigate();
  const { validPin, isPinCreated, isLoading: isPinCreatedLoading } = usePin();

  useEffect(() => {
    if (!validPin && !isPinCreatedLoading && !isPinCreated) {
      navigation("/first-run", { replace: true });
    } else if (!validPin && !isPinCreatedLoading && isPinCreated) {
      navigation("/locked", { replace: true });
    } else if (validPin && !isLoaded) {
      setIsloaded(true);
      navigation("/", { replace: true });
    }
  }, [navigation, isPinCreated, isPinCreatedLoading, validPin]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <LanguageProvider>
        <LocationListener /> {/* 페이지 변경 추적 컴포넌트 */}
        <Outlet />
        <Toaster />
      </LanguageProvider>
    </ThemeProvider>
  );
};
export default App;
