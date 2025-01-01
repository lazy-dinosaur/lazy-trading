import { useLocation } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { usePin } from "@/hooks/usePin";

const Header = () => {
  const { pathname } = useLocation();
  let title = "";

  if (
    pathname.startsWith("/bybit") ||
    pathname.startsWith("/binance") ||
    pathname.startsWith("/bitget")
  ) {
    title = pathname
      .replace("/bybit/", "")
      .replace("/binance/", "")
      .replace("/bitget/", "");
  } else {
    title = pathname.split("/")[1];
  }

  const { pin, isLoading } = usePin();

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-xl capitalize">{title ? title : "Dashboard"}</h1>
      {!isLoading && !pin ? "" : <SidebarTrigger />}
    </div>
  );
};
export default Header;
