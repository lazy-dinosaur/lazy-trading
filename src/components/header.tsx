import { useNavigate } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme/theme-toggle";

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

// 제목 한글 매핑
const titleMap: Record<string, string> = {
  dashboard: "대시보드",
  // search: "검색", // Search 화면에서 직접 전달하므로 제거
  accounts: "계정 관리",
  "add-account": "계정 추가",
  "edit-account": "계정 수정",
  settings: "설정",
  // 필요에 따라 다른 제목 추가
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

  // title이 매핑에 있으면 한글 제목 사용, 없으면 원래 title 사용
  const displayTitle = title ? titleMap[title.toLowerCase()] || title : "";
  // ticker 심볼에서 숫자 제거 (예: 1000PEPE -> PEPE)
  const displaySymbol = ticker?.symbol?.replace(/^[0-9]+/, "");

  return (
    <div className="flex justify-between items-center p-2 bg-background z-20 border-b">
      <div className="flex items-center">
        {backButton && (
          <button
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 dark:focus-visible:ring-zinc-300 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 h-4 w-4 h-lg:h-5 h-lg:w-5 h-xl:h-6 h-xl:w-6 mr-2" // 아이콘과 제목 사이 간격 추가
          >
            <ArrowLeft className="w-3 h-3 h-lg:w-5 h-lg:h-5 h-xl:w-7 h-xl:h-7" />
          </button>
        )}
        <div className="text-xl capitalize flex items-center gap-2">
          {/* ticker가 있으면 ticker 심볼 표시, 없으면 displayTitle 표시 */}
          {ticker ? displaySymbol : displayTitle}
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
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {sidebarButton && (
          <SidebarTrigger className="w-3 h-3 mr-1 h-lg:w-5 h-lg:h-5 h-xl:w-7 h-xl:h-7" />
        )}
      </div>
    </div>
  );
};

export default Header;
