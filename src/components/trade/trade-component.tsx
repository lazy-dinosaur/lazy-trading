// import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "../ui/button";
// import { getTradingConfig, setTradingConfig } from "@/lib/appStorage";
import { ChevronUp, ChevronDown } from "lucide-react";
import { AccountInfo, AccountInfoType } from "@/hooks/useAccountsInfo";
import {
  useFetchTradingConfig,
  useMutateTradingConfig,
} from "@/hooks/settings";
import { useParams } from "react-router";

export const TradeComponent = ({
  id,
  accountsInfo,
}: {
  id?: string;
  accountsInfo?: AccountInfoType;
}) => {
  return (
    <div className="w-full h-full flex-1 flex flex-col space-y-3">
      <div className="flex w-full h-2/5 items-center justify-between">
        <TradingInfo
          accountsInfo={accountsInfo && !!id ? accountsInfo[id] : undefined}
        />
        <TradingAction />
      </div>
      <div className="h-full w-full flex">ddd</div>
    </div>
  );
};

const TradingAction = () => {
  return (
    <div className="flex w-1/3 min-w-32 max-w-64 flex-col items-center justify-between h-full">
      <RiskSetting />
      <TradingSetting />
      <div className="flex flex-col w-full gap-2">
        <Button variant={"long"} className="opacity-90">
          LONG
        </Button>
        <Button variant={"short"} className="opacity-90">
          SHORT
        </Button>
      </div>
    </div>
  );
};
// const AssetInfo = ({ assets }: { assets: BalancesType | undefined }) => {
//   const { base } = useParams();
//   const baseAsset = base?.split(":")[1];
//   const baseAssetInfo = baseAsset && assets && assets?.[baseAsset];
//   const total = assets?.usd.total;
//   const used = assets?.usd.used;
//   const free = assets?.usd.free;
//
//   return (
//     <>
//       <div className="h-full col-span-1">
//         <div className="text-sm text-muted-foreground mb-1">Assets</div>
//         <div className="capitalize">total:</div>
//         <div className="capitalize">free:</div>
//         <div className="capitalize">used:</div>
//       </div>
//       <div className="h-full col-span-2">
//         <div className="text-xs text-muted-foreground mb-1">InUSD</div>
//         {assets ? (
//           <>
//             <div className="capitalize">${total}</div>
//             <div className="capitalize">${free}</div>
//             <div className="capitalize">${used}</div>
//           </>
//         ) : (
//           <>
//             <div className="">스켈레톤 로딩 예정</div>
//           </>
//         )}
//       </div>
//       <div className="h-full col-span-2">
//         {assets ? (
//           <>
//             <div className="text-xs text-muted-foreground mb-1">
//               {baseAsset}
//             </div>
//             <div className="capitalize">
//               {baseAssetInfo ? baseAssetInfo.total : 0}
//             </div>
//             <div className="capitalize">
//               {baseAssetInfo ? baseAssetInfo.free : 0}
//             </div>
//             <div className="capitalize">
//               {baseAssetInfo ? baseAssetInfo.free : 0}
//             </div>
//           </>
//         ) : (
//           <>
//             <div className="">스켈레톤 로딩 예정</div>
//           </>
//         )}
//       </div>
//     </>
//   );
// };

const TradingInfo = ({ accountsInfo }: { accountsInfo?: AccountInfo }) => {
  const assets = accountsInfo?.balance;
  const { base } = useParams();
  const baseAsset = base?.split(":")[1];
  const baseAssetInfo = baseAsset && assets && assets?.[baseAsset];
  const total = assets?.usd.total;
  const used = assets?.usd.used;
  const free = assets?.usd.free;
  return (
    <div className="h-full w-full flex flex-col items-center justify-between">
      {accountsInfo ? (
        <>
          <div className="text-xs text-muted-foreground mb-1">TradingInfo</div>
          <div className="capitalize text-muted-foreground">StopLossHigh</div>
          <div className="capitalize text-muted-foreground">StopLossLow</div>
        </>
      ) : (
        <>
          <div className="">스켈레톤 로딩 예정</div>
        </>
      )}
      <span className="grid grid-cols-7 grid-rows-3 w-full">
        <span className="text-xs text-muted-foreground capitalize">
          balance
        </span>
        <span className="text-xs text-muted-foreground capitalize col-span-2">
          total
        </span>
        <span className="text-xs text-muted-foreground capitalize col-span-2">
          free
        </span>
        <span className="text-xs text-muted-foreground capitalize col-span-2">
          used
        </span>
        <span className="text-xs text-muted-foreground capitalize ">
          {baseAsset}
        </span>
        <span className="text-sm capitalize col-span-2">
          {baseAssetInfo ? baseAssetInfo.total : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {baseAssetInfo ? baseAssetInfo.free : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {baseAssetInfo ? baseAssetInfo.used : 0}
        </span>
        <span className="text-xs text-muted-foreground capitalize">Usd</span>
        <span className="text-sm capitalize col-span-2">
          {total ? total : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {used ? total : 0}
        </span>
        <span className="text-sm capitalize col-span-2">
          {free ? total : 0}
        </span>
      </span>
    </div>
  );
};

const TradingSetting = () => {
  const { data: tradingConfig } = useFetchTradingConfig();
  const { mutate: setTradingConfig, isPending } = useMutateTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">R/R</span>
        <span className="text-sm font-semibold">
          {tradingConfig?.riskRatio} : 1
        </span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border-t"
          disabled={isPending}
          onClick={() => {
            const riskRatio = tradingConfig?.riskRatio
              ? tradingConfig.riskRatio + 0.5 > 5
                ? 5
                : tradingConfig.riskRatio + 0.5
              : 1.5;
            setTradingConfig({ riskRatio });
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border-b"
          disabled={isPending}
          onClick={() => {
            const riskRatio = tradingConfig?.riskRatio
              ? tradingConfig.riskRatio - 0.5 < 0.5
                ? 0.5
                : tradingConfig.riskRatio - 0.5
              : 1.5;
            setTradingConfig({ riskRatio });
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};

const RiskSetting = () => {
  const { data: tradingConfig } = useFetchTradingConfig();
  const { mutate: setTradingConfig, isPending } = useMutateTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">Risk</span>
        <span className="text-sm font-semibold">{tradingConfig?.risk}%</span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border-t"
          disabled={isPending}
          onClick={() => {
            const risk = tradingConfig?.risk
              ? tradingConfig.risk + 0.5 > 5
                ? 5
                : tradingConfig.risk + 0.5
              : 1.5;
            setTradingConfig({ risk });
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border-b"
          disabled={isPending}
          onClick={() => {
            const risk = tradingConfig?.risk
              ? tradingConfig.risk - 0.5 < 0.5
                ? 0.5
                : tradingConfig.risk - 0.5
              : 1.5;
            setTradingConfig({ risk });
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};
