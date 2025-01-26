import { useNavigate } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export type HeaderType = {
  backButton?: boolean;
  sidebarButton?: boolean;
  title?: string;
  ticker?: {
    symbol?: string;
    percentage?: number;
    isTickerLoading: boolean;
  };
};

const Header = ({
  backButton = false,
  sidebarButton = true,
  title,
  ticker,
}: HeaderType) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (ticker) {
      navigate("/search");
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center">
        {backButton && (
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:focus-visible:ring-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-8 w-8"
          >
            <ArrowLeft className="w-7 h-7" />
          </button>
        )}
        <div className="text-xl capitalize flex items-center gap-2">
          {title ?? ticker?.symbol}
          {ticker && (
            <span
              className={cn(
                "px-1 text-sm rounded-md bg-opacity-50",
                ticker.percentage && ticker.percentage < 0
                  ? "bg-red-700 text-red-400"
                  : "bg-green-700 text-green-400",
              )}
            >
              {ticker.percentage && ticker.percentage >= 0 && "+"}
              {ticker.percentage?.toFixed(2)}%
            </span>
          )}
        </div>
      </div>
      {sidebarButton && <SidebarTrigger />}
    </div>
  );
};

export default Header;
