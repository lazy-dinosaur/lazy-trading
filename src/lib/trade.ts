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
  leverage: number;
}

interface TargetInfo {
  price: number;
  percentage: string;
}

export interface PositionInfo {
  stoploss: StopLossInfo;
  target: TargetInfo;
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
): number => {
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

export const calculatePositionInfo = (
  currentPrice: number,
  stopLossPrice: number,
  riskRatio: number,
  risk: number,
  ccxtInstance: Exchange,
  symbol: string,
  isLong: boolean,
  availableBalance?: number,
  tradingFee?: TradingFeeInfo,
): PositionInfo => {
  const stopLossPercentage = calculateStopLossPercentage(
    currentPrice,
    stopLossPrice,
    isLong,
  );
  const leverage = calculateLeverage(risk, parseFloat(stopLossPercentage));
  const targetPrice = calculateTargetPrice(
    currentPrice,
    stopLossPrice,
    riskRatio,
    isLong,
  );

  const result: PositionInfo = {
    stoploss: {
      price: stopLossPrice,
      percentage: stopLossPercentage,
      formatted: ccxtInstance.priceToPrecision(symbol, stopLossPrice),
      leverage: leverage,
    },
    target: {
      price: targetPrice,
      percentage: calculateTargetPercentage(currentPrice, targetPrice),
    },
  };

  // 계정 잔고 정보가 있을 때만 포지션 계산
  if (availableBalance && tradingFee) {
    const stopLossPercentageNum = parseFloat(stopLossPercentage);
    const riskAmount = availableBalance * (risk / 100); // 리스크 금액

    // 포지션 사이즈 계산 (P = R / (SL% / L))
    // R: 리스크 금액, SL%: 스탑로스 퍼센트, L: 레버리지
    const positionSize = riskAmount / (stopLossPercentageNum / leverage);

    // 필요 증거금 계산
    const margin = positionSize / leverage;

    // 진입 수수료
    const entryFee = positionSize * tradingFee.taker;
    // 청산 수수료
    const exitFee = positionSize * tradingFee.taker;
    // 총 수수료
    const totalFee = entryFee + exitFee;

    // 스탑로스 도달 시 손실금액 (수수료 포함)
    const totalLoss = riskAmount + totalFee;

    result.position = {
      size: Number(ccxtInstance.amountToPrecision(symbol, positionSize)),
      margin: Number(ccxtInstance.costToPrecision(symbol, margin)),
      fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
      totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
    };
  }

  return result;
};
