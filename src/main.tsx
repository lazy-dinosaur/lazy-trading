import { createRoot } from "react-dom/client";
import "./index.css";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Accounts from "./screens/accounts.tsx";
import Trade from "./screens/trade.tsx";
import Search from "./screens/search.tsx";
import App from "./App.tsx";
import Index from "./screens/index.tsx";
import Dashboard from "./screens/dashboard.tsx";
import SetPin from "./screens/set-pin.tsx";
import Locked from "./screens/locked.tsx";
import Layout from "./components/Layout.tsx";
import AddAccount from "./screens/add-account.tsx";
import Providers from "./contexts/contextProviders.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Providers>
      <MemoryRouter>
        <Routes>
          <Route element={<App />}>
            <Route path="/" element={<Index />} />
            <Route path="first-run" element={<SetPin />} />
            <Route path="locked" element={<Locked />} />
            <Route element={<Layout />}>
              <Route path="account">
                <Route path="add/:exchange" element={<AddAccount />} />
              </Route>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="search" element={<Search />} />
              <Route path=":exchange/:coin/:base" element={<Trade />} />
            </Route>
          </Route>
        </Routes>
      </MemoryRouter>
    </Providers>
  </QueryClientProvider>,
);
