import { Skeleton } from "@/components/ui/skeleton";
import { TradeCard } from "@/components/ui/trade-card";
import { useAccounts } from "@/contexts/accounts/use";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";

export const AssetsList = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get("id");
  const { accountsBalance, isLoading: isAccountsLoading } = useAccounts();

  const currentBalance = accountId
    ? accountsBalance?.[accountId]?.balance
    : null;

  // USDT, BTC, ETH 등 주요 자산만 표시하거나, 잔액이 0 이상인 자산만 표시
  const assetItems = currentBalance
    ? Object.entries(currentBalance)
        .filter(
          ([asset, balance]) =>
            balance.total > 0 && !["USD", "USDC"].includes(asset), // USD, USDC 제외 및 잔액 0 초과 필터링
        )
        .map(([asset, balance], index) => ({
          id: index,
          asset: asset,
          amount: balance.total, // 사용 가능 잔액(free) 대신 총 잔액(total) 표시
        }))
    : [];

  if (isAccountsLoading) {
    return (
      <div className="space-y-2">
        <div className="px-1 text-sm font-medium text-muted-foreground">
          {t('trade.owned_assets')}
        </div>
        {[...Array(4)].map((_, i) => (
          <TradeCard key={i} variant="compact">
            <div className="flex items-center justify-between py-1">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-20 h-5" />
            </div>
          </TradeCard>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="px-1 text-sm font-medium text-muted-foreground">
        {t('trade.owned_assets')} ({assetItems.length})
      </div>
      {assetItems.length > 0 ? (
        assetItems.map((item) => <AssetCard key={item.id} {...item} />)
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          {t('trade.no_owned_assets')}
        </div>
      )}
    </div>
  );
};

interface AssetCardProps {
  asset: string;
  amount: number;
}

const AssetCard = ({ asset, amount }: AssetCardProps) => (
  <TradeCard variant="compact">
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <span className="font-medium">{asset}</span>
      </div>
      <div className="font-semibold">{amount.toFixed(2)}</div>
    </div>
  </TradeCard>
);
