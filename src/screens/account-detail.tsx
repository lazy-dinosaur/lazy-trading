import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router";
import { useAccounts } from "@/contexts/accounts/use";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUSDValue } from "@/lib/utils";
import { useEffect, useState } from "react";
// import {  ChartData } from "@/hooks/use-balance-history";
// import CapitalChangeChart from "@/components/capital-change-chart";
// import { useTradeHistory } from "@/hooks/use-trade-history";
// // import { TradeHistoryCard } from "@/components/trade-history-card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const AccountDetail = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, accountsBalance, isLoading } = useAccounts();
  const [activeAssets, setActiveAssets] = useState<string[]>([]);
  // 기간 필터 상태 추가
  // const [periodFilter, setPeriodFilter] = useState<
  //   "7d" | "30d" | "90d" | "all"
  // >("7d");

  // 선택된 기간 필터를 훅에 전달
  // const { data: balanceHistory, isLoading: isLoadingHistory } =
  //   useBalanceHistory(id, { period: periodFilter });

  // 선택된 기간 필터를 훅에 전달
  // const { data: tradeHistoryData, isLoading: isLoadingTradeHistory } =
  // 	useTradeHistory(id, { limit: 100, period: periodFilter });

  // 계정이 존재하지 않는 경우
  const account = id ? accounts?.[id] : null;
  const balanceInfo = id ? accountsBalance?.[id] : null;
  const balance = balanceInfo?.balance;
  console.log(balanceInfo);

  useEffect(() => {
    if (balance && !isLoading) {
      // 잔액이 0보다 큰 자산만 필터링
      const assets = Object.keys(balance)
        .filter(
          (key) =>
            key !== "info" &&
            key !== "timestamp" &&
            key !== "datetime" &&
            key !== "free" &&
            key !== "used" &&
            key !== "total" &&
            key !== "debt" &&
            key !== "usd" &&
            balance[key]?.total > 0,
        )
        .slice(0, 5); // 상위 5개 자산만 표시
      setActiveAssets(assets);
    }
  }, [balance, isLoading]);

  if (!isLoading && (!account || !id)) {
    return (
      <ScreenWrapper headerProps={{ title: t('account.account_detail') }}>
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center justify-center h-96 p-4">
            <p className="text-lg mb-4">{t('account.account_not_exist')}</p>
            <Button onClick={() => navigate("/accounts")}>
              {t('account.back_to_account_list')}
            </Button>
          </div>
        </ScrollArea>
      </ScreenWrapper>
    );
  }

  // 차트 데이터 포맷팅 - CapitalChangeChart 컴포넌트와 동일한 형식으로 변환
  // const chartData: ChartData[] =
  //   balanceHistory?.map((item) => ({
  //     time: item.time || item.date || "",
  //     value: item.value || item.balance || 0,
  //   })) || [];

  return (
    <ScreenWrapper
      headerProps={{ title: t('account.account_detail') }}
      className="overflow-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-background"
    >
      <div className="flex flex-col space-y-6 p-4 pb-20">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{account?.name}</span>
                  <span className="text-lg font-normal text-muted-foreground capitalize">
                    {account?.exchange}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('account.total')}</p>
                    <p className="text-2xl font-medium">
                      {formatUSDValue(balance?.usd?.total || 0)} USD
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t('account.available')}
                    </p>
                    <p className="text-2xl font-medium">
                      {formatUSDValue(balance?.usd?.free || 0)} USD
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {t('account.in_order')}
                    </p>
                    <p className="text-lg font-medium">
                      {formatUSDValue(balance?.usd?.used || 0)} USD
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t('account.position_mode')}</p>
                    <p className="text-lg font-medium capitalize">
                      {account?.positionMode || "oneway"}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-2">{t('account.assets')}</h3>
                  {activeAssets.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {activeAssets.map((asset) => (
                        <Card key={asset} className="p-3">
                          <div className="flex justify-between">
                            <span className="font-medium">{asset}</span>
                            <span>
                              {formatUSDValue(balance?.[asset]?.total || 0)}{" "}
                              {asset}
                            </span>
                          </div>
                          {balance?.[asset]?.price && (
                            <div className="text-sm text-muted-foreground mt-1">
                              ≈{" "}
                              {formatUSDValue(
                                (balance?.[asset]?.total || 0) *
                                (balance?.[asset]?.price || 0),
                              )}{" "}
                              USD
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">
                      {t('account.no_asset_info')}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 기간 필터 컨트롤 추가 */}
            {/* <div className="flex justify-end"> */}
            {/* 	<Select */}
            {/* 		value={periodFilter} */}
            {/* 		onValueChange={(value: "7d" | "30d" | "90d" | "all") => */}
            {/* 			setPeriodFilter(value) */}
            {/* 		} */}
            {/* 	> */}
            {/* 		<SelectTrigger className="w-[140px]"> */}
            {/* 			<SelectValue placeholder={t('account.select_period')} /> */}
            {/* 		</SelectTrigger> */}
            {/* 		<SelectContent> */}
            {/* 			<SelectItem value="7d">{t('account.last_7_days')}</SelectItem> */}
            {/* 			<SelectItem value="30d">{t('account.last_30_days')}</SelectItem> */}
            {/* 			<SelectItem value="90d">{t('account.last_90_days')}</SelectItem> */}
            {/* 			<SelectItem value="all">{t('account.all_time')}</SelectItem> */}
            {/* 		</SelectContent> */}
            {/* 	</Select> */}
            {/* </div> */}
            {/**/}
            {/* <Card> */}
            {/* 	<CardHeader> */}
            {/* 		<CardTitle>{t('dashboard.capital_change_trend')}</CardTitle> */}
            {/* 	</CardHeader> */}
            {/* 	<CardContent> */}
            {/* 		{isLoadingHistory ? ( */}
            {/* 			<div className="flex justify-center items-center h-48"> */}
            {/* 				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div> */}
            {/* 			</div> */}
            {/* 		) : chartData.length > 0 ? ( */}
            {/* 			<CapitalChangeChart */}
            {/* 				data={chartData} */}
            {/* 				isLoading={isLoadingHistory} */}
            {/* 				isError={false} */}
            {/* 				height={250} */}
            {/* 			/> */}
            {/* 		) : ( */}
            {/* 			<p className="text-center text-muted-foreground py-6"> */}
            {/* 				{t('dashboard.no_capital_change_data')} */}
            {/* 			</p> */}
            {/* 		)} */}
            {/* 	</CardContent> */}
            {/* </Card> */}

            {/* 거래 히스토리 카드 추가 */}
            {/* <TradeHistoryCard */}
            {/*   trades={tradeHistoryData?.trades || []} */}
            {/*   stats={tradeHistoryData?.stats || null} */}
            {/*   isLoading={isLoadingTradeHistory} */}
            {/* /> */}

            <div className="flex justify-between gap-4">
              <Button variant="outline" onClick={() => navigate("/accounts")}>
                {t('account.back_to_account_list')}
              </Button>
              <Button onClick={() => navigate(`/account/edit/${id}`)}>
                {t('account.edit_account')}
              </Button>
              <Button onClick={() => navigate(`/search`)}>
                {t('account.go_trading')}
              </Button>
            </div>
          </>
        )}
      </div>
    </ScreenWrapper>
  );
};

export default AccountDetail;
