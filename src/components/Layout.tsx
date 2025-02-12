import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useCache } from "@/contexts/cache/use";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

export default function Layout() {
  const { cache, isLoading: isCacheLoading, updateCache } = useCache();
  const location = useLocation();

  useEffect(() => {
    if (cache && !isCacheLoading) {
      const fullPath = location.pathname + location.search;
      if (cache.currentRoute !== fullPath) {
        updateCache({ currentRoute: fullPath });
      }
    }
  }, [location.pathname, location.search, isCacheLoading, updateCache, cache]);

  return (
    <SidebarProvider defaultOpen={false}>
      <div
        id="screenWrapper"
        className="h-[100vh] w-[100vw] flex flex-col space-y-3 p-3 xl:space-y-6 xl:p-6"
      >
        <Outlet />
      </div>
      <AppSidebar />
    </SidebarProvider>
  );
}
