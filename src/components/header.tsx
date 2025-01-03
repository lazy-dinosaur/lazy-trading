import { useLocation, useNavigate } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { usePin } from "@/hooks/usePin";
import { ArrowLeft } from "lucide-react";
import { useTicker } from "@/hooks/useExchange";
import { cn } from "@/lib/utils";
import { useAppStateCache } from "@/hooks/useAppStateCache";

const Header = () => {
  const { pathname } = useLocation();
  const { isLoaded } = useAppStateCache();
  const navigate = useNavigate();
  const fetchTicker = useTicker();
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
    isLoaded && (
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isExchangePath && (
            <button
              onClick={handleBack}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-7 w-7"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="text-lg capitalize flex items-center gap-2 px-1">
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
    )
  );
};

export default Header;
