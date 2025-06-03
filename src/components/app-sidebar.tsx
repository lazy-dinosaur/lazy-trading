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
import { useTranslation } from "react-i18next";

// Menu items.
const getMenuItems = (t: any) => [
  {
    title: t('common.dashboard'),
    url: "/dashboard",
    icon: Home,
  },
  {
    title: t('common.search'),
    url: "/search",
    icon: Search,
  },
  {
    title: t('common.accounts'),
    url: "/accounts",
    icon: HandCoins,
  },
  // {
  //   title: t('common.trade'),
  //   url: "/trade",
  //   icon: ChartCandlestick,
  // },
  // {
  //   title: t('common.settings'),
  //   url: "#",
  //   icon: Settings,
  // },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  
  const items = getMenuItems(t);
  
  return (
    <Sidebar side="right">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('common.navigation', '네비게이션')}</SidebarGroupLabel>
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
