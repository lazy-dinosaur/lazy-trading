import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useFetchCache, useUpdateCache } from "@/hooks/cache";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

export default function Layout() {
  const { data: cacheData, isLoading: isCacheLoading } = useFetchCache();
  const { mutate: updateCache } = useUpdateCache();
  const location = useLocation();

  useEffect(() => {
    if (
      cacheData &&
      cacheData.currentRoute != location.pathname &&
      !isCacheLoading
    ) {
      updateCache({ currentRoute: location.pathname });
    }
  }, [location, isCacheLoading, updateCache, cacheData]);
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="h-[100vh] w-[100vw] flex flex-col space-y-6 p-6">
        <Header />
        <Outlet />
      </div>
      <AppSidebar />
    </SidebarProvider>
  );
}
