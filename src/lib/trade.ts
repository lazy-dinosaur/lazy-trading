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
    const totalFeeRate = tradingFee.taker * 2; // 진입 + 청산 수수료

    // 전체 자본을 사용한다고 가정했을 때 필요한 레버리지 계산
    // riskAmount = availableBalance * (stopLossDistance/100 + totalFeeRate) * leverage
    // leverage = riskAmount / (availableBalance * (stopLossDistance/100 + totalFeeRate))
    const calculatedLeverage =
      riskAmount / (availableBalance * (stopLossDistance / 100 + totalFeeRate));

    // 소수점 첫째자리까지 반올림
    return Math.round(calculatedLeverage * 10) / 10;
  }

  // 사용 가능한 자본이 없는 경우
  if (tradingFee) {
    const totalFeeRate = tradingFee.taker * 2;
    return (
      Math.round(
        (risk / (Math.abs(stopLossPercentage) + totalFeeRate * 100)) * 10,
      ) / 10
    );
  }

  return Math.round((risk / Math.abs(stopLossPercentage)) * 10) / 10;
};

export const calculateTargetPrice = (
  currentPrice: number,
  stopLossPrice: number,
  riskRatio: number,
  isLong: boolean,
  tradingFee?: TradingFeeInfo,
): number => {
  const distance = Math.abs(currentPrice - stopLossPrice);
  const baseTargetPrice = isLong
    ? currentPrice + distance * riskRatio
    : currentPrice - distance * riskRatio;

  // 수수료가 있는 경우, 메이커 수수료를 고려하여 타겟 가격 조정
  if (tradingFee) {
    const totalFeeRate = tradingFee.maker * 2; // 진입(테이커) + 청산(메이커) 수수료
    return isLong
      ? baseTargetPrice * (1 + totalFeeRate) // 롱의 경우 수수료만큼 더 올라가야 함
      : baseTargetPrice * (1 - totalFeeRate); // 숏의 경우 수수료만큼 더 내려가야 함
  }

  return baseTargetPrice;
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
  // UI 표시용 기본 정보 계산 (기존 코드 유지)
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
    tradingFee,
  );

  const calculatedLeverage = calculateLeverage(
    risk,
    parseFloat(stopLossPercentage),
    tradingFee,
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
    leverage: Math.min(calculatedLeverage, maxLeverage),
  };

  // 실제 매매 정보 계산
  if (availableBalance && tradingFee) {
    const isUSDTContract = symbol.includes("USDT");
    const riskAmount = availableBalance * (risk / 100);
    const stopLossDistance = Math.abs(
      ((currentPrice - stopLossPrice) / currentPrice) * 100,
    );
    const totalFeeRate = tradingFee.taker * 2;

    if (isUSDTContract) {
      // BTC/USDT의 경우
      // availableBalance는 USDT
      // positionSize는 BTC 수량으로 계산
      const positionSizeUSDT =
        riskAmount / (stopLossDistance / 100 + totalFeeRate);
      const positionSize = positionSizeUSDT / currentPrice; // BTC 수량으로 변환

      const margin = positionSizeUSDT / maxLeverage;
      const totalFee = positionSizeUSDT * totalFeeRate;
      const stopLossLoss = positionSizeUSDT * (stopLossDistance / 100);
      const totalLoss = stopLossLoss + totalFee;

      // 최종 포지션 정보
      result.position = {
        size: Number(ccxtInstance.amountToPrecision(symbol, positionSize)),
        margin: Number(ccxtInstance.costToPrecision(symbol, margin)),
        fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
        totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
      };
    } else {
      // BTC/USD의 경우
      // availableBalance는 BTC
      // positionSize는 USD 금액으로 계산
      const positionSize =
        (riskAmount * currentPrice) / (stopLossDistance / 100 + totalFeeRate);

      const margin = positionSize / maxLeverage;
      const totalFee = positionSize * totalFeeRate;
      const stopLossLoss = positionSize * (stopLossDistance / 100);
      const totalLoss = stopLossLoss + totalFee;

      // 최종 포지션 정보
      result.position = {
        size: Number(ccxtInstance.amountToPrecision(symbol, positionSize)),
        margin: Number(ccxtInstance.costToPrecision(symbol, margin)),
        fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
        totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
      };
    }

    console.log({
      symbol,
      isUSDTContract,
      availableBalance,
      riskAmount,
      currentPrice,
      position: result.position,
      stopLossDistance,
      totalFee: result.position.fee,
      totalLoss: result.position.totalLoss,
    });
  }

  return result;
};
