import { createRoot } from "react-dom/client";
import "./index.css";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Setup from "./screens/setup.tsx";
import Accounts from "./screens/accounts.tsx";
import Trade from "./screens/trade.tsx";
import Search from "./screens/search.tsx";
import App from "./App.tsx";
import Protector from "./components/protector.tsx";
import Index from "./screens/index.tsx";
import Dashboard from "./screens/dashboard.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      <Routes>
        <Route element={<App />}>
          <Route path="/" element={<Index />} />
          <Route path="setup" element={<Setup />} />
          <Route element={<Protector />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="search" element={<Search />} />
            <Route path=":exchange/:coin/:base" element={<Trade />} />
          </Route>
        </Route>
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>,
);
