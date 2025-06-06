import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrade } from "@/contexts/trade/use";
import { useSearchParams } from "react-router";
import { Wallet, PlusCircle } from "lucide-react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export const AccountSelector = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { exchangeAccounts, accountsBalance, isAccountsLoading } = useTrade();
  const id = searchParams.get("id");
  const exchange = searchParams.get("exchange");

  // 현재 선택된 계정 정보 가져오기
  const selectedAccount =
    id && exchangeAccounts
      ? exchangeAccounts.find((account) => account.id === id)
      : null;

  const selectedBalance =
    id && accountsBalance ? accountsBalance[id]?.balance?.usd?.total : null;

  if (isAccountsLoading) {
    return (
      <div className="flex items-center gap-2 bg-card border p-2 rounded-md min-w-36 h-9">
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  // 계정 ID는 있지만 해당 계정을 찾을 수 없는 경우
  if (id && !selectedAccount) {
    return (
      <div className="flex items-center gap-2 bg-card border p-2 rounded-md min-w-36 h-9 text-sm text-red-500">
        {t('trade.account_not_found')}
      </div>
    );
  }

  // 계정이 없는 경우 계정 추가 링크 보여주기
  if (!exchangeAccounts || exchangeAccounts.length === 0) {
    return (
      <Link
        to={`/account/add${exchange ? `?exchange=${exchange}` : ""}`}
        className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-md min-w-36 transition-colors"
        onClick={() => {
          // 현재 URL 파라미터 저장
          const currentParams = searchParams.toString();
          sessionStorage.setItem("returnToTradeScreen", currentParams);
        }}
      >
        <PlusCircle className="h-4 w-4" />
        <span className="text-sm font-medium">{t('trade.add_new_account')}</span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col">
      <Select
        value={id ? id : undefined}
        onValueChange={(value) => {
          const newParams = new URLSearchParams(searchParams);
          newParams.set("id", value);
          setSearchParams(newParams);
        }}
      >
        <SelectTrigger className="min-w-36 h-9 bg-card/80 border rounded-md">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder={t('trade.select_account')} />
          </div>
        </SelectTrigger>

        <SelectContent className="max-h-[40vh]">
          <SelectGroup>
            {exchangeAccounts.map((account) => {
              const { id } = account;
              const totalBalance =
                accountsBalance && accountsBalance[id]?.balance?.usd?.total;
              return (
                <div key={id} className="py-1 border-b last:border-b-0">
                  <SelectItem
                    className="h-8 flex gap-2 items-center"
                    value={id}
                  >
                    <span className="text-sm font-medium">{account.name}</span>
                  </SelectItem>

                  <div className="flex justify-between text-xs text-muted-foreground px-8 pb-1">
                    <span>{t('account.balance')}:</span>
                    <span className="font-semibold">
                      ${totalBalance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              );
            })}
          </SelectGroup>

          {/* 계정 추가 링크 */}
          <div className="pt-2 px-2 border-t mt-1">
            <Link
              to={`/account/add${exchange ? `?exchange=${exchange}` : ""}`}
              className="flex items-center gap-2 text-primary/80 hover:text-primary p-1 text-xs transition-colors"
              onClick={() => {
                // 현재 URL 파라미터 저장
                const currentParams = searchParams.toString();
                sessionStorage.setItem("returnToTradeScreen", currentParams);
              }}
            >
              <PlusCircle className="h-3 w-3" />
              <span>{t('trade.add_new_account')}</span>
            </Link>
          </div>
        </SelectContent>
      </Select>
      {/* 선택된 계정 정보가 있으면 잔액 표시 */}
      {selectedAccount && selectedBalance && (
        <div className="text-xs text-right text-muted-foreground mt-1">
          {t('account.balance')}: ${selectedBalance.toFixed(2)}
        </div>
      )}
    </div>
  );
};
