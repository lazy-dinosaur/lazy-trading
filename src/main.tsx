import { createRoot } from "react-dom/client";
import "./index.css";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Setup from "./screens/setup.tsx";
import Accounts from "./screens/accounts.tsx";
import Trade from "./screens/trade.tsx";
import Search from "./screens/search.tsx";
import App from "./App.tsx";
import Dashboard from "./screens/dashboard.tsx";
import Protector from "./layouts/Protector.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="setup" element={<Setup />} />
          <Route element={<Protector />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="search" element={<Search />} />
            <Route path=":exchange/:coin/:base" element={<Trade />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);
