import { useQuery } from "@tanstack/react-query";
import { DecryptedAccount, ExchangeType } from "./accounts";
import { CCXTType } from "@/contexts/ccxt/type";
import { useCCXT } from "@/contexts/ccxt/use";
import { Exchange, LeverageTier } from "ccxt";
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
  calculatedLeverage: number;
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
  // 스탑로스까지의 거리 계산
  const stopLossDistance = Math.abs(currentPrice - stopLossPrice);

  // 수수료를 고려한 실제 타겟 거리 계산
  if (tradingFee) {
    const totalFeeRate = tradingFee.maker * 1; // 진입 + 청산 수수료
    const feeAdjustedDistance = stopLossDistance * (1 + totalFeeRate);

    // 수수료를 감안한 타겟 가격 계산
    return isLong
      ? currentPrice + feeAdjustedDistance * riskRatio
      : currentPrice - feeAdjustedDistance * riskRatio;
  }

  // 수수료가 없는 경우 기본 계산
  return isLong
    ? currentPrice + stopLossDistance * riskRatio
    : currentPrice - stopLossDistance * riskRatio;
};

export const calculateTargetPercentage = (
  currentPrice: number,
  targetPrice: number,
): string => {
  return (((targetPrice - currentPrice) / currentPrice) * 100).toFixed(2);
};

interface LeverageResult {
  leverage: number;
  maxPositionSize: number;
}

function findOptimalLeverageAndSize(
  calculatedSize: number,
  availableBalance: number,
  leverageTiers: LeverageTier[],
): LeverageResult {
  // 티어가 없는 경우 기본값 반환
  if (!leverageTiers?.length) {
    return {
      leverage: 125,
      maxPositionSize: calculatedSize,
    };
  }

  // 티어를 포지션 사이즈 기준으로 내림차순 정렬
  const sortedTiers = [...leverageTiers].sort(
    (a, b) => (b.maxNotional ?? 0) - (a.maxNotional ?? 0),
  );

  let optimalTier: LeverageTier | undefined;

  // 1. 먼저 계산된 사이즈를 수용할 수 있는 가장 작은 티어를 찾음
  for (const tier of sortedTiers) {
    if (tier.maxNotional && calculatedSize <= tier.maxNotional) {
      optimalTier = tier;
    } else {
      break;
    }
  }

  // 2. 적절한 티어를 찾지 못했다면 가장 큰 포지션 사이즈를 허용하는 티어 선택
  if (!optimalTier) {
    optimalTier = sortedTiers[0];
  }

  // 3. 선택된 티어에서 실제 가능한 포지션 사이즈 계산
  const maxPositionWithBalance =
    availableBalance * (optimalTier.maxLeverage ?? 125);
  const maxPositionSize = Math.min(
    optimalTier.maxNotional ?? calculatedSize,
    maxPositionWithBalance,
  );

  return {
    leverage: optimalTier.maxLeverage ?? 125,
    maxPositionSize,
  };
}

export const calculatePositionInfo = ({
  currentPrice,
  stopLossPrice,
  riskRatio,
  risk,
  ccxtInstance,
  symbol,
  isLong,
  leverageInfo,
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
  leverageInfo: { maxLeverage: number; leverageTier?: LeverageTier[] };
  availableBalance?: number;
  tradingFee?: TradingFeeInfo;
}): PositionInfo => {
  // UI 표시용 기본 정보 계산 (기존 코드 유지)

  console.log("사용 가능한 자본:", availableBalance);

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
    leverage: Math.min(calculatedLeverage, leverageInfo.maxLeverage),
    calculatedLeverage: Math.min(calculatedLeverage, leverageInfo.maxLeverage),
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
      // USDT 계약의 경우
      const positionSizeUSDT =
        riskAmount / (stopLossDistance / 100 + totalFeeRate);
      console.log("usdt기준 계산 전 포지션 규모:", positionSizeUSDT);

      // 최적 레버리지와 포지션 사이즈 계산
      const { leverage, maxPositionSize } = findOptimalLeverageAndSize(
        positionSizeUSDT,
        availableBalance,
        leverageInfo.leverageTier || [],
      );
      console.log("usdt기준 계산 후 포지션 규모:", maxPositionSize);

      const finalPositionSizeUSDT = Math.min(positionSizeUSDT, maxPositionSize);
      const positionSize = finalPositionSizeUSDT / currentPrice; // BTC 수량으로 변환
      const margin = finalPositionSizeUSDT / leverage;
      const totalFee = finalPositionSizeUSDT * totalFeeRate;
      const stopLossLoss = finalPositionSizeUSDT * (stopLossDistance / 100);
      const totalLoss = stopLossLoss + totalFee;

      try {
        result.position = {
          size: Number(ccxtInstance.amountToPrecision(symbol, positionSize)),
          margin: Number(ccxtInstance.costToPrecision(symbol, margin)),
          fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
          totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
        };
        result.calculatedLeverage = leverage;
      } catch (error) {
        console.error("Failed to calculate position details:", error);
        delete result.position;
      }
    } else {
      // USD 계약의 경우
      const positionSize =
        (riskAmount * currentPrice) / (stopLossDistance / 100 + totalFeeRate);
      console.log("usd기준 계산 전 포지션 규모:", positionSize);

      // 최적 레버리지와 포지션 사이즈 계산
      const { leverage, maxPositionSize } = findOptimalLeverageAndSize(
        positionSize,
        availableBalance * currentPrice, // USD 가치로 변환
        leverageInfo.leverageTier || [],
      );
      console.log("usd기준 계산 후 포지션 규모:", maxPositionSize);

      const finalPositionSize = Math.min(positionSize, maxPositionSize);
      const margin = finalPositionSize / leverage;
      const totalFee = finalPositionSize * totalFeeRate;
      const stopLossLoss = finalPositionSize * (stopLossDistance / 100);
      const totalLoss = stopLossLoss + totalFee;

      try {
        result.position = {
          size: Number(
            ccxtInstance.amountToPrecision(symbol, finalPositionSize),
          ),
          margin: Number(ccxtInstance.costToPrecision(symbol, margin)),
          fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
          totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
        };
        result.calculatedLeverage = leverage;
      } catch (error) {
        console.error("Failed to calculate position details:", error);
        delete result.position;
      }
    }
  }

  return result;
};
