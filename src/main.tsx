import { createRoot } from "react-dom/client";
import "./index.css";
import { MemoryRouter, Route, Routes } from "react-router";
import StartupLayout from "./layouts/StartupLayout.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Setup from "./screens/setup.tsx";
import Accounts from "./screens/accounts.tsx";
import Trade from "./screens/trade.tsx";
import Search from "./screens/search.tsx";
import Layout from "./layouts/Layout.tsx";
import App from "./App.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      <Routes>
        <Route element={<StartupLayout />}>
          {/*시작 한 뒤 핀번호가 생성된 적이 있었는지 확인  */}
          {/*없다면 셋업화면으로 넘어감*/}
          <Route index element={<App />} />
          {/* 셋업 화면에서는 핀번호를 설정하고 최초의 api를 등록함 */}
          <Route path="setup" element={<Setup />} />
        </Route>
        <Route element={<Layout />}>
          <Route path=":exchange/:ticker" element={<Trade />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="search" element={<Search />} />
        </Route>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);
