import { ThemeProvider } from "@/components/theme-provider";
import { Outlet } from "react-router";
import { useMiddleware } from "./hooks/useMiddleware";

//초기 로딩과 초기 셋업 불러오기
//로딩 스크린 넣기

const App = () => {
  useMiddleware();

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <Outlet />
    </ThemeProvider>
  );
};
export default App;
