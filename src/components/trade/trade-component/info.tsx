import { useTrade } from "@/contexts/trade/use";
import { ExchangeType } from "@/lib/accounts";
import { Link, useSearchParams } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface TradeInfoProps {
  tradeDirection?: "long" | "short";
}

export const TradeInfo = ({ tradeDirection = "long" }: TradeInfoProps) => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const {
    tradeInfo,
    balanceInfo,
    tickerQuery,
    marketInfoQuery,
    isAccountsLoading,
  } = useTrade();

  const { exchangeAccounts } = useTrade();

  const exchange = searchParams.get("exchange") as ExchangeType;

  const isTradeInfoLoading =
    tickerQuery.isLoading || marketInfoQuery.isLoading || !tradeInfo;

  const isBalanceLoading =
    !exchangeAccounts && (isAccountsLoading || !balanceInfo);

  // 트레이드 방향에 따른 스타일 설정
  const directionStyle =
    tradeDirection === "long"
      ? {
          bgColor: "bg-green-500/10",
          textColor: "text-green-500",
          infoBoxBg: "bg-green-500/5",
        }
      : {
          bgColor: "bg-red-500/10",
          textColor: "text-red-500",
          infoBoxBg: "bg-red-500/5",
        };

  return (
    <div className="h-full w-full flex flex-col gap-3 overflow-hidden p-2">
      {/* 상단 헤더 영역 */}
      <div className="flex w-full items-center justify-between bg-muted/20 p-2.5 rounded-md">
        <span className="text-sm font-medium">
          {tradeDirection === "long" ? t('trade.long_position_info') : t('trade.short_position_info')}
        </span>
        <div className="flex gap-4 text-xs">
          {isTradeInfoLoading ? (
            <>
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-3.5 w-16" />
            </>
          ) : (
            <>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground">{t('trade.maker_fee')}</span>
                <span className="font-semibold">
                  {tradeInfo?.tradingfee?.maker}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-muted-foreground">{t('trade.taker_fee')}</span>
                <span className="font-semibold">
                  {tradeInfo?.tradingfee?.taker}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 트레이딩 정보 영역 */}
      {isTradeInfoLoading ? (
        <div className="flex-1 w-full bg-accent/10 rounded-md p-3 border">
          <div className="flex justify-center mb-3">
            <div
              className={cn(
                "px-4 py-1 rounded-md text-center",
                directionStyle.bgColor,
                directionStyle.textColor,
              )}
            >
              <span className="font-semibold text-sm">
                {tradeDirection === "long" ? t('trade.long_position') : t('trade.short_position')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">{t('trade.stoploss')}</div>
              <div className="text-right">
                <Skeleton className="h-4 w-full ml-auto" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">{t('trade.target_price')}</div>
              <div className="text-right">
                <Skeleton className="h-4 w-full ml-auto" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">{t('trade.leverage')}</div>
              <div className="text-right">
                <Skeleton className="h-4 w-16 ml-auto" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">{t('trade.position_size')}</div>
              <div className="text-right">
                <Skeleton className="h-4 w-full ml-auto" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full bg-accent/10 rounded-md p-3 border">
          <div className="flex justify-center mb-3">
            <div
              className={cn(
                "px-4 py-1 rounded-md text-center",
                directionStyle.bgColor,
                directionStyle.textColor,
              )}
            >
              <span className="font-semibold text-sm">
                {tradeDirection === "long" ? t('trade.long_position') : t('trade.short_position')}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">{t('trade.stoploss')}</div>
              <div
                className={cn(
                  "text-right p-1.5 rounded-md",
                  directionStyle.infoBoxBg,
                )}
              >
                <div className="font-medium text-sm">
                  {tradeInfo?.[tradeDirection].stoploss.formatted}
                </div>
                <div className="text-xs text-muted-foreground">
                  ({tradeInfo?.[tradeDirection].stoploss.percentage}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">{t('trade.target_price')}</div>
              <div
                className={cn(
                  "text-right p-1.5 rounded-md",
                  directionStyle.infoBoxBg,
                )}
              >
                <div className="font-medium text-sm">
                  {tradeInfo?.[tradeDirection].target.formatted}
                </div>
                <div className="text-xs text-muted-foreground">
                  ({tradeInfo?.[tradeDirection].target.percentage}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm text-muted-foreground">{t('trade.leverage')}</div>
              <div className="text-right font-bold text-sm">
                {tradeInfo?.[tradeDirection].leverage}x
              </div>
            </div>

            {tradeInfo?.[tradeDirection].position && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-muted-foreground">{t('trade.position_size')}</div>
                <div className="text-right font-medium text-sm">
                  {tradeInfo?.[tradeDirection].position.size}
                </div>
              </div>
            )}

            {tradeInfo?.[tradeDirection].position && (
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm text-muted-foreground">{t('trade.margin_amount')}</div>
                <div className="text-right text-sm">
                  {tradeInfo?.[tradeDirection].position.margin}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 잔고 정보 */}
      {isBalanceLoading ? (
        <div className="w-full border rounded-md p-3 bg-muted/10">
          <div className="text-sm font-medium mb-2">{t('trade.balance_info')}</div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-xs text-muted-foreground">{t('trade.asset')}</div>
              <div className="text-xs text-muted-foreground">{t('trade.total_amount')}</div>
              <div className="text-xs text-muted-foreground">{t('trade.available_amount')}</div>
              <div className="text-xs text-muted-foreground">{t('trade.in_use_amount')}</div>
            </div>

            <div className="grid grid-cols-4 gap-2 items-center">
              <div className="text-xs font-medium">USDT</div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
            </div>

            <div className="grid grid-cols-4 gap-2 items-center border-t pt-2">
              <div className="text-xs font-medium">{t('trade.total')}</div>
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          </div>
        </div>
      ) : balanceInfo ? (
        <div className="w-full border rounded-md p-3 bg-muted/10">
          <div className="text-sm font-medium mb-2">{t('trade.balance_info')}</div>
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2">
              <div className="text-xs font-medium text-muted-foreground">
                {t('trade.asset')}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {t('trade.total_amount')}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {t('trade.available_amount')}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {t('trade.in_use_amount')}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 items-center">
              <div className="text-xs font-semibold">
                {balanceInfo.base.name ?? "USDT"}
              </div>
              <div className="text-xs">{balanceInfo.base.total ?? 0}</div>
              <div className="text-xs">{balanceInfo.base.free ?? 0}</div>
              <div className="text-xs">{balanceInfo.base.used ?? 0}</div>
            </div>

            <div className="grid grid-cols-4 gap-2 items-center border-t pt-2">
              <div className="text-xs font-bold">{t('trade.total_usd')}</div>
              <div className="text-xs font-bold">{balanceInfo.usd.total}</div>
              <div className="text-xs">{balanceInfo.usd.free}</div>
              <div className="text-xs">{balanceInfo.usd.used}</div>
            </div>
          </div>
        </div>
      ) : (
        <Link
          to={`/account/add?exchange=${exchange}`}
          className="w-full border rounded-md p-3 bg-accent/10 font-medium text-center flex flex-col gap-1 hover:bg-accent/20 transition-colors"
        >
          <span className="text-sm">{`${exchange} ${t('trade.api_key_missing')}`}</span>
          <span className="text-xs text-primary">
            {t('trade.click_to_add_api_key')}
          </span>
        </Link>
      )}
    </div>
  );
};
