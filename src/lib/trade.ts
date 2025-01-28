import { useQuery } from "@tanstack/react-query";
import { DecryptedAccount, ExchangeType } from "./accounts";
import { CCXTType } from "@/contexts/ccxt/type";
import { useCCXT } from "@/contexts/ccxt/use";
import { Exchange } from "ccxt";
import { useSearchParams } from "react-router";
import { useAccounts } from "@/contexts/accounts/use";

export const fetchTradingFees = async (
  ccxt: CCXTType,
  exchange: ExchangeType,
  symbol: string,
  account?: DecryptedAccount,
) => {
  if (!ccxt?.[exchange]) {
    throw new Error("Exchange instance not initialized");
  }
  const exchangeInstance = ccxt[exchange].ccxt;
  if (account) {
    exchangeInstance.apiKey = account.apiKey;
    exchangeInstance.secret = account.secretKey;

    // 거래소별 수수료 정보 가져오기
    const fees = await exchangeInstance.fetchTradingFee(symbol);

    return {
      maker: fees.maker, // 메이커 수수료
      taker: fees.taker, // 테이커 수수료
    };
  } else {
    const market = exchangeInstance.market(symbol);

    return {
      // 기본 수수료 정보
      maker: market.maker,
      taker: market.taker,
    };
  }
};

export const useTradingFees = (exchange: ExchangeType, symbol: string) => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { decryptedAccounts } = useAccounts();

  const ccxt = useCCXT();

  return useQuery({
    queryKey: [exchange, symbol, "fees"],
    queryFn: async () =>
      await fetchTradingFees(
        ccxt!,
        exchange,
        symbol,
        id ? decryptedAccounts?.[id] : undefined,
      ),
    enabled: !!ccxt,
  });
};

interface StopLossInfo {
  price: number;
  percentage: string;
  formatted: string;
}

interface TargetInfo {
  price: number;
  percentage: string;
  formatted: string;
}

export interface PositionInfo {
  stoploss: StopLossInfo;
  target: TargetInfo;
  leverage: number;
  position?: {
    size: number;
    margin: number;
    fee: number;
    totalLoss: number; // 손실 + 수수료
  };
}

interface TradingFeeInfo {
  maker: number;
  taker: number;
}

export const calculateStopLossPercentage = (
  currentPrice: number,
  stopLossPrice: number,
  isLong: boolean,
): string => {
  return (
    ((isLong ? currentPrice - stopLossPrice : stopLossPrice - currentPrice) /
      currentPrice) *
    100
  ).toFixed(2);
};

export const calculateLeverage = (
  risk: number,
  stopLossPercentage: number,
  tradingFee?: TradingFeeInfo,
  availableBalance?: number,
  currentPrice?: number,
): number => {
  // 사용 가능한 자본이 있는 경우
  if (availableBalance && currentPrice && tradingFee) {
    const riskAmount = availableBalance * (risk / 100); // 허용된 리스크 금액
    const stopLossDistance = Math.abs(stopLossPercentage);
    const totalFeeRate = (tradingFee.taker + tradingFee.taker) * 100;

    // 전체 자본을 사용한다고 가정했을 때 필요한 레버리지 계산
    // riskAmount = availableBalance * (stopLossDistance/100 + totalFeeRate/100) * leverage
    // leverage = riskAmount / (availableBalance * (stopLossDistance/100 + totalFeeRate/100))
    const calculatedLeverage =
      riskAmount /
      (availableBalance * (stopLossDistance / 100 + totalFeeRate / 100));

    // 소수점 첫째자리까지 반올림
    return Math.round(calculatedLeverage * 10) / 10;
  }

  // 사용 가능한 자본이 없는 경우 기존 방식으로 계산
  if (tradingFee) {
    const totalFeeRate = (tradingFee.taker + tradingFee.taker) * 100;
    return (
      Math.round((risk / (Math.abs(stopLossPercentage) + totalFeeRate)) * 10) /
      10
    );
  }

  return Math.round((risk / Math.abs(stopLossPercentage)) * 10) / 10;
};

export const calculateTargetPrice = (
  currentPrice: number,
  stopLossPrice: number,
  riskRatio: number,
  isLong: boolean,
): number => {
  const distance = Math.abs(currentPrice - stopLossPrice);
  return isLong
    ? currentPrice + distance * riskRatio
    : currentPrice - distance * riskRatio;
};

export const calculateTargetPercentage = (
  currentPrice: number,
  targetPrice: number,
): string => {
  return (((targetPrice - currentPrice) / currentPrice) * 100).toFixed(2);
};

export const calculatePositionInfo = ({
  currentPrice,
  stopLossPrice,
  riskRatio,
  risk,
  ccxtInstance,
  symbol,
  isLong,
  maxLeverage,
  availableBalance,
  tradingFee,
}: {
  currentPrice: number;
  stopLossPrice: number;
  riskRatio: number;
  risk: number;
  ccxtInstance: Exchange;
  symbol: string;
  isLong: boolean;
  maxLeverage: number;
  availableBalance?: number;
  tradingFee?: TradingFeeInfo;
}): PositionInfo => {
  // UI 표시용 기본 정보
  const stopLossPercentage = calculateStopLossPercentage(
    currentPrice,
    stopLossPrice,
    isLong,
  );

  const targetPrice = calculateTargetPrice(
    currentPrice,
    stopLossPrice,
    riskRatio,
    isLong,
  );

  const calculatedLeverage = calculateLeverage(
    risk, // risk로 수정 (riskRatio가 아님)
    parseFloat(stopLossPercentage),
    tradingFee,
    availableBalance,
    currentPrice,
  );

  const result: PositionInfo = {
    stoploss: {
      price: stopLossPrice,
      percentage: stopLossPercentage,
      formatted: ccxtInstance.priceToPrecision(symbol, stopLossPrice),
    },
    target: {
      price: targetPrice,
      percentage: calculateTargetPercentage(currentPrice, targetPrice),
      formatted: ccxtInstance.priceToPrecision(symbol, targetPrice),
    },
    //이건 보여주기용 레버리지야 그래서 계산되어야 하는데?
    leverage: Math.min(calculatedLeverage, maxLeverage),
  };
  console.log(availableBalance);

  // 실제 매매 정보 계산
  if (availableBalance && tradingFee) {
    const riskAmount = availableBalance * (risk / 100); // 허용된 리스크 금액

    // 진입가와 손절가 사이의 거리 계산 (퍼센트)
    const stopLossDistance = Math.abs(
      ((currentPrice - stopLossPrice) / currentPrice) * 100,
    );

    // 총 수수료율 (진입 + 청산)
    const totalFeeRate = tradingFee.taker + tradingFee.taker;

    // 수수료를 포함한 포지션 사이즈 계산
    // riskAmount = positionSize * (stopLossDistance/100 + totalFeeRate)
    // positionSize = riskAmount / (stopLossDistance/100 + totalFeeRate)
    const positionSize =
      (riskAmount / (stopLossDistance / 100 + totalFeeRate)) * maxLeverage;

    // 필요 증거금 계산
    const margin = positionSize / maxLeverage;

    // 수수료 계산
    const entryFee = positionSize * tradingFee.taker; // 진입 수수료
    const exitFee = positionSize * tradingFee.taker; // 청산 수수료
    const totalFee = entryFee + exitFee;

    // 스탑로스에서의 순수 손실
    const stopLossLoss = positionSize * (stopLossDistance / 100);

    // 총 손실 (스탑로스 손실 + 총 수수료) = 리스크 금액
    const totalLoss = stopLossLoss + totalFee;

    // 최종 포지션 정보
    result.position = {
      size: positionSize,
      margin: margin,
      fee: totalFee,
      totalLoss: totalLoss,
    };

    console.log({
      riskAmount,
      positionSize,
      stopLossDistance,
      stopLossLoss,
      totalFee,
      totalLoss,
      // totalLoss와 riskAmount가 같아야 함
    });
  }

  return result;
};
