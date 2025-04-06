import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import App from "./App";
import Layout from "./components/Layout";

// 로딩 컴포넌트
const LoadingComponent = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
  </div>
);

// 지연 로딩으로 코드 분할
const Index = lazy(() => import("./screens/index"));
const SetPin = lazy(() => import("./screens/set-pin"));
const Locked = lazy(() => import("./screens/locked"));
const AddAccount = lazy(() => import("./screens/add-account"));
const AccountEdit = lazy(() => import("./screens/account-edit"));
const Dashboard = lazy(() => import("./screens/dashboard"));
const Accounts = lazy(() => import("./screens/accounts"));
const Search = lazy(() => import("./screens/search"));
const Trade = lazy(() => import("./screens/trade"));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route
          path="/"
          element={
            <Suspense fallback={<LoadingComponent />}>
              <Index />
            </Suspense>
          }
        />
        <Route
          path="first-run"
          element={
            <Suspense fallback={<LoadingComponent />}>
              <SetPin />
            </Suspense>
          }
        />
        <Route
          path="locked"
          element={
            <Suspense fallback={<LoadingComponent />}>
              <Locked />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route path="account">
            <Route
              path="add"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <AddAccount />
                </Suspense>
              }
            />
            <Route
              path="edit/:id"
              element={
                <Suspense fallback={<LoadingComponent />}>
                  <AccountEdit />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="dashboard"
            element={
              <Suspense fallback={<LoadingComponent />}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="accounts"
            element={
              <Suspense fallback={<LoadingComponent />}>
                <Accounts />
              </Suspense>
            }
          />
          <Route
            path="search"
            element={
              <Suspense fallback={<LoadingComponent />}>
                <Search />
              </Suspense>
            }
          />
          <Route
            path="trade"
            element={
              <Suspense fallback={<LoadingComponent />}>
                <Trade />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}
