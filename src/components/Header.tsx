import { useLocation, useNavigate } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { usePin } from "@/hooks/usePin";
import { ArrowLeft } from "lucide-react";
import useExchange from "@/hooks/useExchange";
import { cn } from "@/lib/utils";

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { fetchTicker } = useExchange();
  let title = "";

  const isExchangePath =
    pathname.startsWith("/bybit") ||
    pathname.startsWith("/binance") ||
    pathname.startsWith("/bitget");

  if (isExchangePath) {
    title = pathname
      .replace("/bybit/", "")
      .replace("/binance/", "")
      .replace("/bitget/", "");
  } else {
    title = pathname.split("/")[1];
  }

  const { pin, isLoading } = usePin();

  const handleBack = () => {
    navigate("/search");
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        {isExchangePath && (
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="text-xl capitalize flex items-center gap-2">
          {title ? title : "Dashboard"}
          {isExchangePath && !fetchTicker.isLoading && fetchTicker.data && (
            <span
              className={cn(
                "p-1 text-xs rounded-md bg-opacity-50",
                fetchTicker.data.percentage && fetchTicker.data.percentage < 0
                  ? "bg-red-700 text-red-400"
                  : "bg-green-700 text-green-400",
              )}
            >
              {fetchTicker.data.percentage &&
                fetchTicker.data.percentage >= 0 &&
                "+"}
              {fetchTicker.data.percentage?.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      {!isLoading && !pin ? "" : <SidebarTrigger />}
    </div>
  );
};

export default Header;
