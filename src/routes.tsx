import { Route, Routes } from "react-router";
import App from "./App";
import Index from "./screens/index";
import SetPin from "./screens/set-pin";
import Locked from "./screens/locked";
import Layout from "./components/Layout";
import AddAccount from "./screens/add-account";
import Dashboard from "./screens/dashboard";
import Accounts from "./screens/accounts";
import Search from "./screens/search";
import Trade from "./screens/trade";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route path="/" element={<Index />} />
        <Route path="first-run" element={<SetPin />} />
        <Route path="locked" element={<Locked />} />
        <Route element={<Layout />}>
          <Route path="account">
            <Route path="add" element={<AddAccount />} />
          </Route>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="search" element={<Search />} />
          <Route path="trade" element={<Trade />} />
        </Route>
      </Route>
    </Routes>
  );
}
