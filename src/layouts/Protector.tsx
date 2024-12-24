import { AppSidebar } from "@/components/app-sidebar";
import Header from "@/components/Header";
import Locked from "@/components/Locked";
import PopupContainer from "@/components/PopupContainer";
import { SidebarProvider } from "@/components/ui/sidebar";
import { usePin } from "@/hooks/usePin";
import { Outlet } from "react-router";

export default function Protector() {
  const { pin, isLoading } = usePin();

  return (
    <SidebarProvider>
      <PopupContainer className="flex-col space-y-5">
        <AppSidebar />
        <div className="self-start space-y-2 mx-2">
          <Header />
          {!isLoading && !pin ? <Locked /> : <Outlet />}
        </div>
      </PopupContainer>
    </SidebarProvider>
  );
}
