import { TradingAction } from "./action";
import { TradeInfo } from "./info";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";

export const TradeComponent = () => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");
  const isExtraLargeScreen = useMediaQuery("(min-width: 1280px)");

  // 모바일에서는 롱/숏 탭 형태로 표시
  if (isMobile) {
    return (
      <div className="w-full min-h-[180px] h-auto border rounded-md shadow-sm p-2">
        <Tabs defaultValue="long" className="w-full h-full">
          <TabsList className="w-full grid grid-cols-2 mb-2">
            <TabsTrigger
              value="long"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              롱 포지션
            </TabsTrigger>
            <TabsTrigger
              value="short"
              className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
            >
              숏 포지션
            </TabsTrigger>
          </TabsList>
          <TabsContent value="long" className="mt-1">
            <div className="space-y-3">
              <TradeInfo tradeDirection="long" />
              <TradingAction tradeDirection="long" />
            </div>
          </TabsContent>
          <TabsContent value="short" className="mt-1">
            <div className="space-y-3">
              <TradeInfo tradeDirection="short" />
              <TradingAction tradeDirection="short" />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // 데스크톱에서는 롱/숏 탭 형태로 표시하되 좀 더 큰 화면으로
  return (
    <div className="w-full min-h-[180px] h-auto lg:h-full border rounded-md shadow-sm p-3 bg-card/20">
      <Tabs defaultValue="long" className="w-full h-full">
        <TabsList className="w-full h-full grid grid-cols-2 mb-3">
          <TabsTrigger
            value="long"
            className={`py-1 md:py-1.5 text-xs md:text-sm font-medium data-[state=active]:bg-green-500 data-[state=active]:text-white
              ${isLargeScreen ? "lg:text-base lg:py-1.5" : ""}
              ${isExtraLargeScreen ? "xl:py-2 xl:px-2" : ""}`}
          >
            롱 포지션
          </TabsTrigger>
          <TabsTrigger
            value="short"
            className={`py-1 md:py-1.5 text-xs md:text-sm font-medium data-[state=active]:bg-red-500 data-[state=active]:text-white
              ${isLargeScreen ? "lg:text-base lg:py-1.5" : ""}
              ${isExtraLargeScreen ? "xl:py-2 xl:px-2" : ""}`}
          >
            숏 포지션
          </TabsTrigger>
        </TabsList>
        <TabsContent value="long" className="mt-1 h-[calc(100%-50px)]">
          <div className="flex flex-col md:flex-row gap-3 h-full">
            <div className="w-full md:w-2/3 flex-grow">
              <TradeInfo tradeDirection="long" />
            </div>
            <div className="w-full md:w-1/3 flex-none">
              <TradingAction tradeDirection="long" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="short" className="mt-1 h-[calc(100%-50px)]">
          <div className="flex flex-col md:flex-row gap-3 h-full">
            <div className="w-full md:w-2/3 flex-grow">
              <TradeInfo tradeDirection="short" />
            </div>
            <div className="w-full md:w-1/3 flex-none">
              <TradingAction tradeDirection="short" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
