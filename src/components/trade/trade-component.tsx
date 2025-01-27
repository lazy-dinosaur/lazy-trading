// import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { useTradingConfig } from "@/contexts/settings/use";
import { TradeInfoType } from "@/contexts/trade/type";

export const TradeComponent = () => {
  return (
    <div className="w-full h-full flex-1 flex flex-col space-y-3">
      <div className="flex w-full min-h-max items-center justify-between gap-3">
        {/* <TradeInfo accountsInfo={accountsInfo} tradeInfo={tradeInfo} /> */}
        {/* <TradingAction tradeInfo={tradeInfo} disabled={!accountsInfo} /> */}
      </div>
      <div className=" w-full h-full flex">ddd</div>
    </div>
  );
};

export const TradingAction = ({
  tradeInfo,
  disabled,
}: {
  tradeInfo: TradeInfoType;
  disabled: boolean;
}) => {
  console.log(tradeInfo);
  return (
    <div className="flex w-1/3 min-w-32 max-w-64 flex-col items-center justify-between h-full space-y-3">
      <div className="w-full text-sm text-muted-foreground capitalize">
        Setting
      </div>
      <CloseSetting />
      <RiskSetting />
      <TradingSetting />
      <div className="flex flex-col w-full gap-2">
        <Button variant={"long"} className="opacity-90" disabled={disabled}>
          LONG
        </Button>
        <Button variant={"short"} className="opacity-90" disabled={disabled}>
          SHORT
        </Button>
      </div>
    </div>
  );
};

const CloseSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <>
      <div className="w-full px-2 flex items-center gap-2 justify-center">
        <Switch
          id="partial-close"
          checked={config?.partialClose}
          onCheckedChange={(partialClose) => {
            updateConfig({ partialClose });
          }}
          disabled={isLoading}
        />
        <Label htmlFor="partial-close" className="text-sm">
          Partial Close
        </Label>
      </div>
      {config?.partialClose && (
        <>
          <div className="w-full px-2 flex items-center gap-2 justify-center">
            <Switch
              id="stop-to-even"
              checked={config?.stopToEven}
              onCheckedChange={(stopToEven) => {
                updateConfig({ stopToEven });
              }}
              disabled={isLoading}
            />
            <Label htmlFor="stop-to-even" className="text-sm">
              S/L To Even
            </Label>
          </div>
          <div className="flex w-full items-center justify-center">
            <span className="flex h-full w-full items-center justify-center flex-col">
              <span className="text-xs text-muted-foreground">C/R</span>
              <span className="text-sm font-semibold">
                {config.closeRatio} %
              </span>
            </span>
            <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-accent border"
                // disabled={isPending}
                onClick={() => {
                  const closeRatio = config?.closeRatio
                    ? config.closeRatio + 5 > 100
                      ? 100
                      : config.closeRatio + 5
                    : 50;
                  updateConfig({ closeRatio });
                }}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-accent border"
                // disabled={isPending}
                onClick={() => {
                  const closeRatio = config?.closeRatio
                    ? config.closeRatio - 5 < 5
                      ? 5
                      : config.closeRatio - 5
                    : 50;
                  updateConfig({ closeRatio });
                }}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </span>
          </div>
        </>
      )}
    </>
  );
};

// const TradeInfo = ({
//   accountsInfo,
//   tradeInfo,
// }: {
//   accountsInfo?: AccountInfo;
//   tradeInfo: TradeInfoType;
// }) => {
//   const assets = accountsInfo?.balance;
//   const { exchange, base } = useParams();
//   const baseAsset = base?.split(":")[1];
//   const baseAssetInfo = baseAsset && assets && assets?.[baseAsset];
//   const total = assets?.usd.total;
//   const used = assets?.usd.used;
//   const free = assets?.usd.free;
//   const { config } = useTradingConfig();
//
//   return (
//     <div className="h-full w-full flex flex-col items-center justify-between gap-2">
//       <div className="flex w-full items-center justify-between px-2 ">
//         <span className="text-sm text-muted-foreground capitalize">
//           Trading Info
//         </span>
//         <div className="gap-2 text-xs flex">
//           <span className="space-x-1">
//             <span className="text-muted-foreground">Maker:</span>
//             <span>{tradeInfo?.tradingfee?.maker}</span>
//           </span>
//           <span className="space-x-1">
//             <span className="text-muted-foreground">Taker:</span>
//             <span>{tradeInfo?.tradingfee?.taker}</span>
//           </span>
//         </div>
//       </div>
//       <div className="w-full h-full rounded-md p-2 border">
//         <div className="w-full h-full grid grid-cols-5 grid-rows-6">
//           <span></span>
//           <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center mb-2">
//             LONG
//           </span>
//           <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center mb-2">
//             SHORT
//           </span>
//           <span className="col-span-1 row-span-2 text-muted-foreground font-semibold flex items-center justify-center">
//             S/L
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
//             {tradeInfo?.long}
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
//             {tradeInfo?.short}
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
//             {tradeInfo?.currentPrice && tradeInfo?.long
//               ? (
//                   ((tradeInfo.currentPrice - tradeInfo.long) /
//                     tradeInfo.currentPrice) *
//                   100
//                 ).toFixed(2)
//               : 0}
//             %
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
//             {tradeInfo?.currentPrice && tradeInfo?.short
//               ? (
//                   ((tradeInfo.short - tradeInfo.currentPrice) /
//                     tradeInfo.currentPrice) *
//                   100
//                 ).toFixed(2)
//               : 0}
//             %
//           </span>
//           <span className="col-span-1 row-span-2 text-muted-foreground font-semibold flex items-center justify-center">
//             T/P
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
//             {tradeInfo?.currentPrice && tradeInfo?.long && config?.riskRatio
//               ? (
//                   tradeInfo.currentPrice +
//                   (tradeInfo.currentPrice - tradeInfo.long) * config.riskRatio
//                 ).toFixed(2)
//               : 0}
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
//             {tradeInfo?.currentPrice && tradeInfo?.short && config?.riskRatio
//               ? (
//                   tradeInfo.currentPrice -
//                   (tradeInfo.short - tradeInfo.currentPrice) * config.riskRatio
//                 ).toFixed(2)
//               : 0}
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
//             {tradeInfo?.currentPrice && tradeInfo?.long && config?.riskRatio
//               ? (
//                   ((tradeInfo.currentPrice +
//                     (tradeInfo.currentPrice - tradeInfo.long) *
//                       config.riskRatio -
//                     tradeInfo.currentPrice) /
//                     tradeInfo.currentPrice) *
//                   100
//                 ).toFixed(2)
//               : 0}
//             %
//           </span>
//           <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
//             {tradeInfo?.currentPrice && tradeInfo?.short && config?.riskRatio
//               ? (
//                   ((tradeInfo.currentPrice -
//                     tradeInfo.currentPrice -
//                     (tradeInfo.short - tradeInfo.currentPrice) *
//                       config.riskRatio) /
//                     tradeInfo.currentPrice) *
//                   100
//                 ).toFixed(2)
//               : 0}
//             %
//           </span>
//           <span className="col-span-1 row-span-1 text-muted-foreground font-semibold flex items-center justify-center">
//             Leverage
//           </span>
//           <span className="col-span-2 flex items-center justify-center text-sm">
//             {tradeInfo?.currentPrice &&
//             tradeInfo?.long &&
//             config?.risk &&
//             tradeInfo
//               ? (() => {
//                   // 기본 레버리지 계산 (계정 없을 때)
//                   const basicLeverage =
//                     Math.round(
//                       (config.risk /
//                         Math.abs(
//                           ((tradeInfo.currentPrice - tradeInfo.long) /
//                             tradeInfo.currentPrice) *
//                             100,
//                         )) *
//                         10,
//                     ) / 10;
//
//                   // 계정이 있을 때의 레버리지 계산
//                   if (baseAssetInfo) {
//                     const entryFee =
//                       tradeInfo.currentPrice * tradeInfo.tradingfee.taker;
//                     const exitFee = tradeInfo.long * tradeInfo.tradingfee.taker;
//                     const totalFees = entryFee + exitFee;
//
//                     // 가격 변동 비율
//                     const priceChangePercent = Math.abs(
//                       ((tradeInfo.currentPrice - tradeInfo.long) /
//                         tradeInfo.currentPrice) *
//                         100,
//                     );
//
//                     // // 원하는 리스크 금액
//                     // const riskAmount =
//                     //   (baseAssetInfo.total * config.risk) / 100;
//                     // // 포지션 사이즈 계산
//                     // const positionSize =
//                     //   (riskAmount / priceChangePercent) * 100;
//
//                     // 수수료를 포함한 레버리지 계산
//                     const accountLeverage =
//                       Math.round(
//                         (config.risk /
//                           (priceChangePercent +
//                             (totalFees / tradeInfo.currentPrice) * 100)) *
//                           10,
//                       ) / 10;
//
//                     return Math.min(
//                       baseAssetInfo ? accountLeverage : basicLeverage,
//                       tradeInfo.maxLeverage,
//                     );
//                   }
//
//                   return Math.min(basicLeverage, tradeInfo.maxLeverage);
//                 })()
//               : 0}
//             x
//           </span>
//           <span className="col-span-2 flex items-center justify-center text-sm">
//             {tradeInfo?.currentPrice &&
//             tradeInfo?.short &&
//             config?.risk &&
//             tradeInfo
//               ? (() => {
//                   // 기본 레버리지 계산 (계정 없을 때)
//                   const basicLeverage =
//                     Math.round(
//                       (config.risk /
//                         Math.abs(
//                           ((tradeInfo.short - tradeInfo.currentPrice) /
//                             tradeInfo.currentPrice) *
//                             100,
//                         )) *
//                         10,
//                     ) / 10;
//
//                   // 계정이 있을 때의 레버리지 계산
//                   if (baseAssetInfo) {
//                     const entryFee =
//                       tradeInfo.currentPrice * tradeInfo.tradingfee.taker;
//                     const exitFee =
//                       tradeInfo.short * tradeInfo.tradingfee.taker;
//                     const totalFees = entryFee + exitFee;
//
//                     // 가격 변동 비율
//                     const priceChangePercent = Math.abs(
//                       ((tradeInfo.short - tradeInfo.currentPrice) /
//                         tradeInfo.currentPrice) *
//                         100,
//                     );
//
//                     // // 원하는 리스크 금액
//                     // const riskAmount =
//                     //   (baseAssetInfo.total * config.risk) / 100;
//                     // // 포지션 사이즈 계산
//                     // const positionSize =
//                     //   (riskAmount / priceChangePercent) * 100;
//
//                     // 수수료를 포함한 레버리지 계산
//                     const accountLeverage =
//                       Math.round(
//                         (config.risk /
//                           (priceChangePercent +
//                             (totalFees / tradeInfo.currentPrice) * 100)) *
//                           10,
//                       ) / 10;
//
//                     return Math.min(
//                       baseAssetInfo ? accountLeverage : basicLeverage,
//                       tradeInfo.maxLeverage,
//                     );
//                   }
//
//                   return Math.min(basicLeverage, tradeInfo.maxLeverage);
//                 })()
//               : 0}
//             x
//           </span>
//         </div>
//       </div>
//       {accountsInfo ? (
//         <span className="grid grid-cols-7 grid-rows-3 w-full border rounded-md p-2">
//           <span className="text-xs text-muted-foreground capitalize">
//             balance
//           </span>
//           <span className="text-xs text-muted-foreground capitalize col-span-2">
//             total
//           </span>
//           <span className="text-xs text-muted-foreground capitalize col-span-2">
//             free
//           </span>
//           <span className="text-xs text-muted-foreground capitalize col-span-2">
//             used
//           </span>
//           <span className="text-xs text-muted-foreground capitalize ">
//             {baseAsset}
//           </span>
//           <span className="text-sm capitalize col-span-2">
//             {baseAssetInfo?.total ? baseAssetInfo.total : 0}
//           </span>
//           <span className="text-sm capitalize col-span-2">
//             {baseAssetInfo?.free ? baseAssetInfo.free : 0}
//           </span>
//           <span className="text-sm capitalize col-span-2">
//             {baseAssetInfo?.used ? baseAssetInfo.used : 0}
//           </span>
//           <span className="text-xs text-muted-foreground capitalize">
//             TOTAL
//           </span>
//           <span className="text-sm capitalize col-span-2">
//             {total ? total : 0}
//           </span>
//           <span className="text-sm capitalize col-span-2">
//             {used ? total : 0}
//           </span>
//           <span className="text-sm capitalize col-span-2">
//             {free ? total : 0}
//           </span>
//         </span>
//       ) : (
//         <Link
//           to={`/account/add/${exchange}`}
//           className="w-full border rounded-md p-2 font-bold text-xl text-center flex flex-col hover:underline"
//         >
//           <span>{`No Apikey Detected for ${exchange}.`}</span>
//           <span>Click here to add Apikey.</span>
//         </Link>
//       )}
//     </div>
//   );
// };

const TradingSetting = () => {
  const { config, isLoading, updateConfig } = useTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">R/R</span>
        <span className="text-sm font-semibold">{config?.riskRatio} : 1</span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isLoading}
          onClick={() => {
            const riskRatio = config?.riskRatio
              ? config.riskRatio + 0.5 > 5
                ? 5
                : config.riskRatio + 0.5
              : 1.5;
            updateConfig({ riskRatio });
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isLoading}
          onClick={() => {
            const riskRatio = config?.riskRatio
              ? config.riskRatio - 0.5 < 0.5
                ? 0.5
                : config.riskRatio - 0.5
              : 1.5;
            updateConfig({ riskRatio });
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};

const RiskSetting = () => {
  const { config, updateConfig, isLoading } = useTradingConfig();

  return (
    <div className="flex w-full items-center justify-center">
      <span className="flex h-full w-full items-center justify-center flex-col">
        <span className="text-xs text-muted-foreground">Risk</span>
        <span className="text-sm font-semibold">{config?.risk}%</span>
      </span>
      <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isLoading}
          onClick={() => {
            const risk = config?.risk
              ? config.risk + 0.5 > 5
                ? 5
                : config.risk + 0.5
              : 1.5;
            updateConfig({ risk });
          }}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-accent border"
          disabled={isLoading}
          onClick={() => {
            const risk = config?.risk
              ? config.risk - 0.5 < 0.5
                ? 0.5
                : config.risk - 0.5
              : 1.5;
            updateConfig({ risk });
          }}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </span>
    </div>
  );
};
