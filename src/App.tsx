import { ThemeProvider } from "@/components/theme-provider";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { usePin } from "./contexts/pin/use";
import { Toaster } from "@/components/ui/toaster";

//초기 로딩과 초기 셋업 불러오기
//로딩 스크린 넣기

const App = () => {
  const [isLoaded, setIsloaded] = useState(false);
  const navigation = useNavigate();
  const { validPin, isPinCreated, isLoading: isPinCreatedLoading } = usePin();
  // 텍스트 크기 조절 로직

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
      <Outlet />
      <Toaster />
    </ThemeProvider>
  );
};
export default App;
