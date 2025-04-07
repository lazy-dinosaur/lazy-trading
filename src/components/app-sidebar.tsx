import { HandCoins, Home, Search } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useNavigate } from "react-router";

// Menu items.
const items = [
  {
    title: "대시보드",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "검색",
    url: "/search",
    icon: Search,
  },
  {
    title: "계정 관리",
    url: "/Accounts",
    icon: HandCoins,
  },
  // {
  //   title: "Trade",
  //   url: "/trade",
  //   icon: ChartCandlestick,
  // },
  // {
  //   title: "Settings",
  //   url: "#",
  //   icon: Settings,
  // },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  return (
    <Sidebar side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>네비게이션</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <span
                      onClick={() => {
                        navigate(item.url);
                        toggleSidebar();
                      }}
                      className="text-base font-medium py-1"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
