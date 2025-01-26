// import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "../ui/button";
// import { getTradingConfig, setTradingConfig } from "@/lib/appStorage";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  useFetchTradingConfig,
  useMutateTradingConfig,
} from "@/hooks/settings";
import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { AccountInfo, searchingStopLossCandle } from "@/lib/ccxt";
import { useMarketInfo } from "@/hooks/coin";
import { ExchangeType } from "@/lib/accounts";
import { CandleData } from "./chart-component/candle";
import { useTradingFees } from "@/lib/trade";

type TradeInfoType =
  | {
      long: number;
      short: number;
      currentPrice: number;
      tradingfee: {
        maker: number;
        taker: number;
      };
      maxLeverage: number;
    }
  | undefined;

export const TradeComponent = ({
  accountsInfo,
  candleData,
  isLoading,
}: {
  accountsInfo?: AccountInfo;
  candleData?: CandleData[];
  isLoading: boolean;
}) => {
  console.log(isLoading);
  const [tradeInfo, setTradeInfo] = useState<TradeInfoType>();

  const { exchange, coin, base } = useParams();
  const { data: tradingfee, isLoading: isTradingfeeLoading } = useTradingFees(
    exchange! as ExchangeType,
    `${coin}/${base}`,
  );

  const { data: marketInfo, isLoading: isMarketLoading } = useMarketInfo(
    exchange as ExchangeType,
    `${coin}/${base}`,
  );

  useEffect(() => {
    console.log(tradingfee);
  }, [isTradingfeeLoading, tradingfee]);

  useEffect(() => {
    if (
      candleData &&
      candleData.length > 0 &&
      tradingfee &&
      !isTradingfeeLoading &&
      marketInfo &&
      !isMarketLoading
    ) {
      const currentPrice = candleData[candleData.length - 1].close;
      const highCandle = searchingStopLossCandle(
        candleData,
        candleData.length - 1,
        "high",
      );
      const lowCandle = searchingStopLossCandle(
        candleData,
        candleData.length - 1,
        "low",
      );
      setTradeInfo({
        long: lowCandle.low,
        short: highCandle.high,
        currentPrice,
        tradingfee: {
          taker: tradingfee.taker as number,
          maker: tradingfee.maker as number,
        },
        maxLeverage: marketInfo.maxLeverage,
      });
    }
  }, [
    candleData,
    isTradingfeeLoading,
    tradingfee,
    isMarketLoading,
    marketInfo,
  ]);

  return (
    <div className="w-full h-full flex-1 flex flex-col space-y-3">
      <div className="flex w-full min-h-max items-center justify-between gap-3">
        <TradeInfo accountsInfo={accountsInfo} tradeInfo={tradeInfo} />
        <TradingAction tradeInfo={tradeInfo} disabled={!accountsInfo} />
      </div>
      <div className=" w-full h-full flex">ddd</div>
    </div>
  );
};

const TradingAction = ({
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
  const { data: tradingConfig } = useFetchTradingConfig();
  const { mutate: setTradingConfig, isPending } = useMutateTradingConfig();

  return (
    <>
      <div className="w-full px-2 flex items-center gap-2 justify-center">
        <Switch
          id="partial-close"
          checked={tradingConfig?.partialClose}
          onCheckedChange={(partialClose) => {
            setTradingConfig({ partialClose });
          }}
          disabled={isPending}
        />
        <Label htmlFor="partial-close" className="text-sm">
          Partial Close
        </Label>
      </div>
      {tradingConfig?.partialClose && (
        <>
          <div className="w-full px-2 flex items-center gap-2 justify-center">
            <Switch
              id="stop-to-even"
              checked={tradingConfig?.stopToEven}
              onCheckedChange={(stopToEven) => {
                setTradingConfig({ stopToEven });
              }}
              disabled={isPending}
            />
            <Label htmlFor="stop-to-even" className="text-sm">
              S/L To Even
            </Label>
          </div>
          <div className="flex w-full items-center justify-center">
            <span className="flex h-full w-full items-center justify-center flex-col">
              <span className="text-xs text-muted-foreground">C/R</span>
              <span className="text-sm font-semibold">
                {tradingConfig.closeRatio} %
              </span>
            </span>
            <span className="flex w-full items-center justify-center gap-1 flex-col text-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-accent border"
                // disabled={isPending}
                onClick={() => {
                  const closeRatio = tradingConfig?.closeRatio
                    ? tradingConfig.closeRatio + 5 > 100
                      ? 100
                      : tradingConfig.closeRatio + 5
                    : 50;
                  setTradingConfig({ closeRatio });
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
                  const closeRatio = tradingConfig?.closeRatio
                    ? tradingConfig.closeRatio - 5 < 5
                      ? 5
                      : tradingConfig.closeRatio - 5
                    : 50;
                  setTradingConfig({ closeRatio });
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

const TradeInfo = ({
  accountsInfo,
  tradeInfo,
}: {
  accountsInfo?: AccountInfo;
  tradeInfo: TradeInfoType;
}) => {
  const assets = accountsInfo?.balance;
  const { exchange, base } = useParams();
  const baseAsset = base?.split(":")[1];
  const baseAssetInfo = baseAsset && assets && assets?.[baseAsset];
  const total = assets?.usd.total;
  const used = assets?.usd.used;
  const free = assets?.usd.free;
  const { data: tradingConfig } = useFetchTradingConfig();

  return (
    <div className="h-full w-full flex flex-col items-center justify-between gap-2">
      <div className="flex w-full items-center justify-between px-2 ">
        <span className="text-sm text-muted-foreground capitalize">
          Trading Info
        </span>
        <div className="gap-2 text-xs flex">
          <span className="space-x-1">
            <span className="text-muted-foreground">Maker:</span>
            <span>{tradeInfo?.tradingfee?.maker}</span>
          </span>
          <span className="space-x-1">
            <span className="text-muted-foreground">Taker:</span>
            <span>{tradeInfo?.tradingfee?.taker}</span>
          </span>
        </div>
      </div>
      <div className="w-full h-full rounded-md p-2 border">
        <div className="w-full h-full grid grid-cols-5 grid-rows-6">
          <span></span>
          <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center mb-2">
            LONG
          </span>
          <span className="col-span-2 text-muted-foreground font-semibold flex items-center justify-center mb-2">
            SHORT
          </span>
          <span className="col-span-1 row-span-2 text-muted-foreground font-semibold flex items-center justify-center">
            S/L
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.long}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.short}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.currentPrice && tradeInfo?.long
              ? (
                  ((tradeInfo.currentPrice - tradeInfo.long) /
                    tradeInfo.currentPrice) *
                  100
                ).toFixed(2)
              : 0}
            %
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.currentPrice && tradeInfo?.short
              ? (
                  ((tradeInfo.short - tradeInfo.currentPrice) /
                    tradeInfo.currentPrice) *
                  100
                ).toFixed(2)
              : 0}
            %
          </span>
          <span className="col-span-1 row-span-2 text-muted-foreground font-semibold flex items-center justify-center">
            T/P
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.currentPrice &&
            tradeInfo?.long &&
            tradingConfig?.riskRatio
              ? (
                  tradeInfo.currentPrice +
                  (tradeInfo.currentPrice - tradeInfo.long) *
                    tradingConfig.riskRatio
                ).toFixed(2)
              : 0}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center text-sm">
            {tradeInfo?.currentPrice &&
            tradeInfo?.short &&
            tradingConfig?.riskRatio
              ? (
                  tradeInfo.currentPrice -
                  (tradeInfo.short - tradeInfo.currentPrice) *
                    tradingConfig.riskRatio
                ).toFixed(2)
              : 0}
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.currentPrice &&
            tradeInfo?.long &&
            tradingConfig?.riskRatio
              ? (
                  ((tradeInfo.currentPrice +
                    (tradeInfo.currentPrice - tradeInfo.long) *
                      tradingConfig.riskRatio -
                    tradeInfo.currentPrice) /
                    tradeInfo.currentPrice) *
                  100
                ).toFixed(2)
              : 0}
            %
          </span>
          <span className="col-span-2 col-row-1 flex items-center justify-center mb-2 text-sm">
            {tradeInfo?.currentPrice &&
            tradeInfo?.short &&
            tradingConfig?.riskRatio
              ? (
                  ((tradeInfo.currentPrice -
                    tradeInfo.currentPrice -
                    (tradeInfo.short - tradeInfo.currentPrice) *
                      tradingConfig.riskRatio) /
                    tradeInfo.currentPrice) *
                  100
                ).toFixed(2)
              : 0}
            %
          </span>
          <span className="col-span-1 row-span-1 text-muted-foreground font-semibold flex items-center justify-center">
            Leverage
          </span>
          <span className="col-span-2 flex items-center justify-center text-sm">
            {tradeInfo?.currentPrice &&
            tradeInfo?.long &&
            tradingConfig?.risk &&
            tradeInfo
              ? (() => {
                  // 기본 레버리지 계산 (계정 없을 때)
                  const basicLeverage =
                    Math.round(
                      (tradingConfig.risk /
                        Math.abs(
                          ((tradeInfo.currentPrice - tradeInfo.long) /
                            tradeInfo.currentPrice) *
                            100,
                        )) *
                        10,
                    ) / 10;

                  // 계정이 있을 때의 레버리지 계산
                  if (baseAssetInfo) {
                    const entryFee =
                      tradeInfo.currentPrice * tradeInfo.tradingfee.taker;
                    const exitFee = tradeInfo.long * tradeInfo.tradingfee.taker;
                    const totalFees = entryFee + exitFee;

                    // 가격 변동 비율
                    const priceChangePercent = Math.abs(
                      ((tradeInfo.currentPrice - tradeInfo.long) /
                        tradeInfo.currentPrice) *
                        100,
                    );

                    // // 원하는 리스크 금액
                    // const riskAmount =
                    //   (baseAssetInfo.total * tradingConfig.risk) / 100;
                    // // 포지션 사이즈 계산
                    // const positionSize =
                    //   (riskAmount / priceChangePercent) * 100;

                    // 수수료를 포함한 레버리지 계산
                    const accountLeverage =
                      Math.round(
                        (tradingConfig.risk /
                          (priceChangePercent +
                            (totalFees / tradeInfo.currentPrice) * 100)) *
                          10,
                      ) / 10;

                    return Math.min(
                      baseAssetInfo ? accountLeverage : basicLeverage,
                      tradeInfo.maxLeverage,
                    );
                  }

                  return Math.min(basicLeverage, tradeInfo.maxLeverage);
                })()
              : 0}
            x
          </span>
          <span className="col-span-2 flex items-center justify-center text-sm">
            {tradeInfo?.currentPrice &&
            tradeInfo?.short &&
            tradingConfig?.risk &&
            tradeInfo
              ? (() => {
                  // 기본 레버리지 계산 (계정 없을 때)
                  const basicLeverage =
                    Math.round(
                      (tradingConfig.risk /
                        Math.abs(
                          ((tradeInfo.short - tradeInfo.currentPrice) /
                            tradeInfo.currentPrice) *
                            100,
                        )) *
                        10,
                    ) / 10;

                  // 계정이 있을 때의 레버리지 계산
                  if (baseAssetInfo) {
                    const entryFee =
                      tradeInfo.currentPrice * tradeInfo.tradingfee.taker;
                    const exitFee =
                      tradeInfo.short * tradeInfo.tradingfee.taker;
                    const totalFees = entryFee + exitFee;

                    // 가격 변동 비율
                    const priceChangePercent = Math.abs(
                      ((tradeInfo.short - tradeInfo.currentPrice) /
                        tradeInfo.currentPrice) *
                        100,
                    );

                    // // 원하는 리스크 금액
                    // const riskAmount =
                    //   (baseAssetInfo.total * tradingConfig.risk) / 100;
                    // // 포지션 사이즈 계산
                    // const positionSize =
                    //   (riskAmount / priceChangePercent) * 100;

                    // 수수료를 포함한 레버리지 계산
                    const accountLeverage =
                      Math.round(
                        (tradingConfig.risk /
                          (priceChangePercent +
                            (totalFees / tradeInfo.currentPrice) * 100)) *
                          10,
                      ) / 10;

                    return Math.min(
                      baseAssetInfo ? accountLeverage : basicLeverage,
                      tradeInfo.maxLeverage,
                    );
                  }

                  return Math.min(basicLeverage, tradeInfo.maxLeverage);
                })()
              : 0}
            x
          </span>
        </div>
      </div>
      {accountsInfo ? (
        <span className="grid grid-cols-7 grid-rows-3 w-full border rounded-md p-2">
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
            {baseAssetInfo?.total ? baseAssetInfo.total : 0}
          </span>
          <span className="text-sm capitalize col-span-2">
            {baseAssetInfo?.free ? baseAssetInfo.free : 0}
          </span>
          <span className="text-sm capitalize col-span-2">
            {baseAssetInfo?.used ? baseAssetInfo.used : 0}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            TOTAL
          </span>
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
      ) : (
        <Link
          to={`/account/add/${exchange}`}
          className="w-full border rounded-md p-2 font-bold text-xl text-center flex flex-col hover:underline"
        >
          <span>{`No Apikey Detected for ${exchange}.`}</span>
          <span>Click here to add Apikey.</span>
        </Link>
      )}
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
          className="h-6 w-6 hover:bg-accent border"
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
          className="h-6 w-6 hover:bg-accent border"
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
          className="h-6 w-6 hover:bg-accent border"
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
          className="h-6 w-6 hover:bg-accent border"
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
