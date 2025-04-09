import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { usePin } from "./contexts/pin/use";
import { Toaster } from "@/components/ui/toaster";
import { LocationListener } from "./components/analytics/location-listener";

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
      <LocationListener /> {/* 페이지 변경 추적 컴포넌트 */}
      <Outlet />
      <Toaster />
    </ThemeProvider>
  );
};
export default App;
