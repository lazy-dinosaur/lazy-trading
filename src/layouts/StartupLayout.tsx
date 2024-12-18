import Loading from "@/components/Loading";
import { ThemeProvider } from "@/components/theme-provider";
import { useAccounts } from "@/hooks/useAccounts";
import { usePin } from "@/hooks/usePin";
import { useStartup } from "@/hooks/useStartup";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";

//초기 로딩과 초기 셋업 불러오기
//로딩 스크린 넣기

const StartupLayout = () => {
  const navigation = useNavigate();
  const { setPinCreated, pin, pinCreated, isLoading: isPinLoading } = usePin();
  const { accounts, isLoading: isAccountsLoading } = useAccounts();
  const { isLoading: isStartedLoading, isStarted, setStarted } = useStartup();
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading && !isPinLoading && !isAccountsLoading && !isStartedLoading) {
      setLoading(false);
    }
  }, [
    setLoading,
    isLoading,
    isPinLoading,
    isAccountsLoading,
    isStartedLoading,
  ]);

  useEffect(() => {
    //만약 앱이 시작되지 않았고 등록된 계정이 존재하지 않는다면 핀을 초기화하고 계저도 초기화해야함
    if (!isLoading && !isStarted && !accounts?.keys) {
      setPinCreated(false);
    }
    setStarted(true);

    if (!isLoading && !!isStarted && (!pinCreated || !accounts?.keys)) {
      navigation("/setup");
    }
  }, [
    isStarted,
    isLoading,
    setStarted,
    setPinCreated,
    accounts,
    pin,
    navigation,
    pinCreated,
  ]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      {isLoading ? <Loading /> : <Outlet />}
    </ThemeProvider>
  );
};
export default StartupLayout;
