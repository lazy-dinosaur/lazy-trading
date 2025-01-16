import { useLocation, useNavigate, useParams } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExchangeType } from "@/hooks/useAccounts";
import { useFetchTicker } from "@/hooks/coin";

export const getSymbol = (coin: string, base: string) => `${coin}/${base}`;

const Header = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const symbol = `${params.coin}/${params.base}`;
  const exchange = params.exchange as ExchangeType;

  const { data: tickerData, isLoading: isTickerLoading } = useFetchTicker({
    exchange,
    symbol,
  });

  let title = "";

  const isExchangePath =
    pathname.startsWith("/bybit") ||
    pathname.startsWith("/binance") ||
    pathname.startsWith("/bitget");

  if (isExchangePath) {
    title = pathname
      .replace("/bybit/", "")
      .replace("/binance/", "")
      .replace("/bitget/", "")
      .replace(/^[0-9]+/, "")
      .split(":")[0];
  } else {
    title = pathname.split("/")[1];
  }

  const handleBack = () => {
    navigate("/search");
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        {isExchangePath && (
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-8 w-8"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
        )}
        <div className="text-xl capitalize flex items-center gap-2">
          {title ? title : "Dashboard"}
          {isExchangePath && !isTickerLoading && tickerData && (
            <span
              className={cn(
                "px-1 text-sm rounded-md bg-opacity-50",
                tickerData.percentage && tickerData.percentage < 0
                  ? "bg-red-700 text-red-400"
                  : "bg-green-700 text-green-400",
              )}
            >
              {tickerData.percentage && tickerData.percentage >= 0 && "+"}
              {tickerData.percentage?.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      <SidebarTrigger />
    </div>
  );
};

export default Header;
