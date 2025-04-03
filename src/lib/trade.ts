import { useQuery } from "@tanstack/react-query";
import { DecryptedAccount, ExchangeType } from "./accounts";
import { CCXTType } from "@/contexts/ccxt/type";
import { useCCXT } from "@/contexts/ccxt/use";
import { Exchange, LeverageTier } from "ccxt";
import { useSearchParams } from "react-router";
import { useAccounts } from "@/contexts/accounts/use";

/**
 * Fetches trading fees for a specific symbol from an exchange
 * @param ccxt - CCXT instance
 * @param exchange - Exchange type (e.g. 'binance', 'bybit')
 * @param symbol - Trading pair symbol (e.g. 'BTC/USDT')
 * @param account - Optional account credentials for authenticated requests
 * @returns Object containing maker and taker fees
 * @throws {Error} When exchange is not initialized
 * @throws {ExchangeError} When exchange API request fails
 * @throws {AuthenticationError} When account credentials are invalid
 */
export const fetchTradingFees = async (
  ccxt: CCXTType,
  exchange: ExchangeType,
  symbol: string,
  account?: DecryptedAccount,
) => {
  if (!ccxt?.[exchange]) {
    throw new Error("Exchange instance not initialized");
  }

  const exchangeInstance = account
    ? account.exchangeInstance.ccxt
    : ccxt[exchange].ccxt;

  try {
    if (account && exchange != "bitget") {
      const fees = await exchangeInstance.fetchTradingFee(symbol);
      console.log(fees);

      if (!fees?.maker || !fees?.taker) {
        throw new Error("Invalid fee structure returned from exchange");
      }

      return {
        maker: fees.maker,
        taker: fees.taker,
      };
    } else {
      const market = ccxt[exchange].ccxt.market(symbol);

      if (!market?.maker || !market?.taker) {
        throw new Error("Market data does not contain fee information");
      }

      return {
        maker: market.maker,
        taker: market.taker,
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      // Enhance error message with context
      throw new Error(`Failed to fetch trading fees: ${error.message}`);
    }
    throw error;
  }
};

/**
 * React Query hook for fetching trading fees
 * @param exchange - Exchange type to fetch fees from
 * @param symbol - Trading pair symbol
 * @returns Query result containing trading fees or error state
 */
export const useTradingFees = (exchange: ExchangeType, symbol: string) => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const { decryptedAccounts } = useAccounts();
  const ccxt = useCCXT();

  return useQuery({
    queryKey: [exchange, symbol, "fees", id],
    queryFn: async () => {
      if (!ccxt) {
        throw new Error("CCXT context not initialized");
      }
      return await fetchTradingFees(
        ccxt,
        exchange,
        symbol,
        id ? decryptedAccounts?.[id] : undefined,
      );
    },
    enabled: !!ccxt,
    retry: (failureCount, error) => {
      // Only retry on network errors, not on authentication errors
      if (error instanceof Error && error.message.includes("authentication")) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
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
  account?: {
    positionMode?: "oneway" | "hedge";
  };
  insufficientCapital?: {
    calculatedSize: number;
    minRequiredSize: number;
    message: string;
  };
  error?: {
    message: string;
    type: string;
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

interface LiquidityAnalysis {
  slippage: SlippageInfo;
  recommendedSize: {
    safe: number; // 안전 거래 규모
    moderate: number; // 중간 위험 거래 규모
    maximum: number; // 최대 거래 규모
  };
  impact: {
    entryPriceImpact: number; // 예상 진입가 영향
    liquidationRiskLevel: "safe" | "moderate" | "high"; // 청산 위험도
    potentialLoss: number; // 슬리피지로 인한 잠재적 손실
  };
  warning: string[]; // 경고 메시지 배열
}

interface SlippageInfo {
  estimated: number; // 예상 슬리피지 퍼센트
  warning: string; // 경고 메시지
  severity: "safe" | "moderate" | "high"; // 위험도
}

export const analyzeLiquidityAndSize = async (
  ccxtInstance: Exchange,
  symbol: string,
  currentPrice: number,
  leverage: number,
  availableBalance: number,
  isLong: boolean,
  stopLossPrice: number,
): Promise<LiquidityAnalysis> => {
  try {
    const orderbook = await ccxtInstance.fetchOrderBook(symbol);
    const relevantSide = isLong ? orderbook.asks : orderbook.bids;
    const warnings: string[] = [];

    // 오더북 분석을 통한 유동성 깊이 계산
    const liquidityDepth = relevantSide.reduce((acc, [price, volume]) => {
      return acc + (volume ?? 0) * (price ?? currentPrice);
    }, 0);

    // 기본 슬리피지 계산
    const calculateSlippageForSize = (size: number) => {
      let accumulatedVolume = 0;
      let weightedPrice = 0;
      const basePrice = relevantSide[0]?.[0] ?? currentPrice;

      for (const [price, volume] of relevantSide) {
        if (accumulatedVolume >= size) break;
        const remainingSize = Math.min(volume ?? 0, size - accumulatedVolume);
        weightedPrice += (price ?? currentPrice) * remainingSize;
        accumulatedVolume += remainingSize;
      }

      if (accumulatedVolume === 0) return 0;

      const expectedPrice = weightedPrice / accumulatedVolume;
      return Math.abs(((expectedPrice - basePrice) / basePrice) * 100);
    };

    // 레버리지를 고려한 안전 거래 규모 계산
    const maxPositionSize = availableBalance * leverage;

    // 청산가격까지의 거리
    const liquidationDistance =
      Math.abs((stopLossPrice - currentPrice) / currentPrice) * 100;

    // 안전 거래 규모 계산 (슬리피지가 청산가격 거리의 10% 이하)
    const calculateSafeSize = () => {
      let low = 0;
      let high = maxPositionSize;
      let safeSize = 0;

      while (low <= high) {
        const mid = (low + high) / 2;
        const slippage = calculateSlippageForSize(mid);

        if (slippage <= liquidationDistance * 0.1) {
          safeSize = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      return safeSize;
    };

    const safeSize = calculateSafeSize();
    const moderateSize = safeSize * 2; // 중간 위험 규모
    const maximumSize = safeSize * 3; // 최대 권장 규모

    // 현재 설정된 포지션 크기에 대한 슬리피지 계산
    const currentSlippage = calculateSlippageForSize(maxPositionSize);

    // 잠재적 손실 계산
    const potentialLoss = (maxPositionSize * currentSlippage) / 100;

    // 청산 위험도 평가
    let liquidationRiskLevel: "safe" | "moderate" | "high" = "safe";
    if (currentSlippage > liquidationDistance * 0.3) {
      liquidationRiskLevel = "high";
      warnings.push(
        `현재 레버리지(${leverage}x)와 포지션 크기는 슬리피지로 인한 즉각적인 청산 위험이 있습니다.`,
      );
    } else if (currentSlippage > liquidationDistance * 0.15) {
      liquidationRiskLevel = "moderate";
      warnings.push(
        `현재 레버리지(${leverage}x)에서 슬리피지로 인한 청산 위험이 있습니다.`,
      );
    }

    // 거래량 기반 추가 경고
    if (maxPositionSize > liquidityDepth * 0.1) {
      warnings.push("현재 시장 유동성 대비 너무 큰 포지션 크기입니다.");
    }

    return {
      slippage: {
        estimated: currentSlippage,
        warning: warnings.join(" "),
        severity: liquidationRiskLevel,
      },
      recommendedSize: {
        safe: safeSize,
        moderate: moderateSize,
        maximum: maximumSize,
      },
      impact: {
        entryPriceImpact: currentSlippage,
        liquidationRiskLevel,
        potentialLoss,
      },
      warning: warnings,
    };
  } catch (error) {
    console.error("Failed to analyze liquidity:", error);
    return {
      slippage: {
        estimated: 0,
        warning: "유동성 분석 실패",
        severity: "high",
      },
      recommendedSize: {
        safe: 0,
        moderate: 0,
        maximum: 0,
      },
      impact: {
        entryPriceImpact: 0,
        liquidationRiskLevel: "high",
        potentialLoss: 0,
      },
      warning: ["유동성 분석 중 오류가 발생했습니다."],
    };
  }
};

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
    try {
      const isUSDTContract = symbol.includes("USDT");
      const stopLossDistance = Math.abs(
        ((currentPrice - stopLossPrice) / currentPrice) * 100,
      );
      const totalFeeRate = tradingFee.taker * 2;

      if (isUSDTContract) {
        // USDT 계약의 경우 - 기존 코드 유지
        const riskAmount = availableBalance * (risk / 100);
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
        
        // 최소 주문 수량 검사 추가
        const market = ccxtInstance.market(symbol);
        const minAmount = market?.limits?.amount?.min || 0;
        
        if (positionSize < minAmount) {
          // 최소 주문 수량보다 작은 경우 오류 발생 대신 경고 정보 추가
          result.insufficientCapital = {
            calculatedSize: positionSize,
            minRequiredSize: minAmount,
            message: `자본이 부족합니다. 최소 주문 수량은 ${minAmount}이지만 계산된 수량은 ${positionSize.toFixed(8)}입니다.`
          };
        } else {
          const margin = finalPositionSizeUSDT / leverage;
          const totalFee = finalPositionSizeUSDT * totalFeeRate;
          const stopLossLoss = finalPositionSizeUSDT * (stopLossDistance / 100);
          const totalLoss = stopLossLoss + totalFee;

          result.position = {
            size: Number(ccxtInstance.amountToPrecision(symbol, positionSize)),
            margin: Number(ccxtInstance.costToPrecision(symbol, margin)),
            fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
            totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
          };
          result.calculatedLeverage = leverage;
        }
      } else {
        // USD 계약의 경우 (BTC/USD 등) - 개선된 로직
        console.log("========== 인버스 계약 계산 ==========");
        
        // 스탑로스 거리와 수수료를 고려한 계산
        const stopLossDistance = Math.abs(
          ((currentPrice - stopLossPrice) / currentPrice) * 100
        );
        const totalFeeRate = tradingFee.taker * 2;
        
        // 위험 금액 계산 (자본 × 가격 × 위험률)
        const riskAmount = availableBalance * currentPrice * (risk / 100);
        
        // 계약 크기 계산 - 위험 금액 기반으로 계산
        const contractSize = riskAmount / (stopLossDistance / 100 + totalFeeRate);
        
        console.log("계산된 계약 규모:", contractSize);
        
        // 목표 레버리지 계산
        const targetLeverage = calculateLeverage(
          risk,
          parseFloat(stopLossPercentage),
          tradingFee,
        );
        
        let selectedTier: LeverageTier | undefined;
        let finalLeverage = targetLeverage;
        let finalContractSize = contractSize;
        
        // 티어 선택 로직 개선 - 계약 규모에 따라 적절한 티어 선택
        if (leverageInfo.leverageTier?.length) {
          console.log("원래 티어 정보:", JSON.stringify(leverageInfo.leverageTier, null, 2));
          
          // 인버스 계약에서는 티어의 maxNotional을 BTC에서 USD로 변환해서 비교
          // USD 계약 크기 = BTC 수량 * 현재 가격
          
          // 티어를 maxNotional 기준으로 오름차순 정렬 (작은 값부터)
          const sortedTiers = [...leverageInfo.leverageTier].sort(
            (a, b) => (a.maxNotional ?? 0) - (b.maxNotional ?? 0)
          );
          
          // 계산된 계약 규모(USD)를 수용할 수 있는 가장 적합한 티어 찾기
          let usdToKonVertedContractSize = contractSize / currentPrice; // USD를 BTC로 변환
          console.log("계산된 계약 규모(USD):", contractSize);
          console.log("BTC로 변환된 계약 규모:", usdToKonVertedContractSize);
          
          for (const tier of sortedTiers) {
            const maxNotionalUsd = (tier.maxNotional ?? 0) * currentPrice;
            console.log(`티어 ${tier.tier}: maxNotional(BTC) ${tier.maxNotional}, maxNotional(USD) ${maxNotionalUsd}`);
            
            if (tier.maxNotional && usdToKonVertedContractSize <= tier.maxNotional) {
              selectedTier = tier;
              // 최대 레버리지 적용 (리스크 관리는 주문 크기로 조절)
              finalLeverage = tier.maxLeverage ?? leverageInfo.maxLeverage;
              
              console.log("최대 레버리지 적용:", finalLeverage, "× (목표 레버리지:", targetLeverage, ")");
              
              finalContractSize = contractSize;
              finalContractSize = contractSize;
              console.log(`티어 ${tier.tier} 선택: maxNotional(BTC) ${tier.maxNotional}, maxNotional(USD) ${maxNotionalUsd}, 레버리지 ${finalLeverage}`);
              break;
            }
          }
          
          // 적합한 티어를 찾지 못한 경우 (모든 티어의 maxNotional이 변환된 계약 규모보다 작은 경우)
          if (!selectedTier) {
            // 가장 큰 maxNotional을 가진 티어 선택
            selectedTier = sortedTiers[sortedTiers.length - 1];
            // 최대 레버리지 적용 (리스크 관리는 주문 크기로 조절)
            finalLeverage = selectedTier?.maxLeverage ?? leverageInfo.maxLeverage;
            
            console.log("최대 레버리지 적용:", finalLeverage, "× (목표 레버리지:", targetLeverage, ")");
            
            // 최대 티어의 maxNotional을 USD로 변환한 값으로 계약 크기 제한
            const maxNotionalUsd = (selectedTier?.maxNotional ?? 0) * currentPrice;
            finalContractSize = Math.min(contractSize, maxNotionalUsd);
            
            console.log(`최대 티어 선택: tier ${selectedTier?.tier}, maxNotional(BTC) ${selectedTier?.maxNotional}, maxNotional(USD) ${maxNotionalUsd}, 레버리지 ${finalLeverage}`);
          }
        }
        
        // 시장 정보 확인
        const market = ccxtInstance.market(symbol);
        
        // 최소 주문 크기 확인
        let minAmount = market?.limits?.amount?.min || 1;
        
        // 계약 크기가 정의되어 있으면 확인
        if (market?.contractSize) {
          // 일부 거래소에서는 contractSize가 있으면 그 단위로 거래해야 함
          minAmount = Math.max(minAmount, Number(market.contractSize) || 1);
        }
        
        // 계약 크기가 최소보다 작은지 확인
        if (finalContractSize < minAmount) {
          finalContractSize = minAmount;
        }
        
        // 인버스 계약은 정수로 처리
        finalContractSize = Math.floor(finalContractSize);
        
        console.log("최종 계약 규모:", finalContractSize);
        console.log("최종 레버리지:", finalLeverage);
        
        // 필요한 마진 계산
        const margin = finalContractSize / finalLeverage;
        const availableMarginUSD = availableBalance * currentPrice;
        
        console.log("필요 마진:", margin);
        console.log("가용 마진(USD):", availableMarginUSD);
        
        // 마진 버퍼 계산 (가용 마진의 95%까지만 사용)
        const usableMargin = availableMarginUSD * 0.95;
        console.log("사용 가능한 마진 (95%):", usableMargin);
        
        // 자본 충분성 검사 - 가용 마진이 필요 마진보다 큰지 확인
        if (margin > usableMargin) {
          // 자본 부족 - 정보 설정
          console.log("자본 부족 상태 감지: 필요 마진이 가용 마진보다 큼");
          
          // 마진이 부족하면, 가능한 최대 계약 크기 계산 (최대 레버리지 적용)
          const maxPossibleContractSize = Math.floor(usableMargin * finalLeverage);
          
          // 최소 계약 크기 보다 작으면 자본 부족으로 표시
          if (maxPossibleContractSize < minAmount) {
            result.insufficientCapital = {
              calculatedSize: finalContractSize,
              minRequiredSize: minAmount,
              message: `자본이 부족합니다. 필요 마진: ${margin.toFixed(2)} USD, 가용 마진: ${availableMarginUSD.toFixed(2)} USD`
            };
          } else {
            // 가능한 최대 계약 크기로 조정하고 자본 부족 상태는 설정하지 않음
            console.log("계약 크기 조정: 원래", finalContractSize, "→ 조정됨", maxPossibleContractSize);
            finalContractSize = maxPossibleContractSize;
            
            // 마진 재계산
            const newMargin = finalContractSize / finalLeverage;
            console.log("조정된 마진:", newMargin);
            
            // 포지션 설정 
            const totalFee = finalContractSize * totalFeeRate;
            const stopLossLoss = finalContractSize * (stopLossDistance / 100);
            const totalLoss = stopLossLoss + totalFee;

            result.position = {
              // 인버스 계약은 정수로 저장
              size: Math.floor(finalContractSize),
              margin: Number(ccxtInstance.costToPrecision(symbol, newMargin)),
              fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
              totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
            };
            result.calculatedLeverage = finalLeverage;
            
            // 함수를 여기서 종료
            return result;
          }
        } else {
          // 정상 계산 완료
          const totalFee = finalContractSize * totalFeeRate;
          const stopLossLoss = finalContractSize * (stopLossDistance / 100);
          const totalLoss = stopLossLoss + totalFee;

          result.position = {
            // 인버스 계약은 정수로 저장
            size: Math.floor(finalContractSize),
            margin: Number(ccxtInstance.costToPrecision(symbol, margin)),
            fee: Number(ccxtInstance.costToPrecision(symbol, totalFee)),
            totalLoss: Number(ccxtInstance.costToPrecision(symbol, totalLoss)),
          };
          result.calculatedLeverage = finalLeverage;
        }
      }
    } catch (error) {
      console.error("Failed to calculate position details:", error);
      // 오류 정보 추가
      result.error = {
        message: error instanceof Error ? error.message : "Unknown error",
        type: "calculation_error"
      };
    }
  }

  return result;
};

interface LiquidityAnalysisParams {
  ccxtInstance: Exchange;
  symbol: string;
  currentPrice: number;
  leverage: number;
  availableBalance: number;
  isLong: boolean;
  stopLossPrice: number;
}

export const calculateLiquidityAnalysis = async ({
  ccxtInstance,
  symbol,
  currentPrice,
  leverage,
  availableBalance,
  isLong,
  stopLossPrice,
}: LiquidityAnalysisParams): Promise<LiquidityAnalysis | null> => {
  try {
    return await analyzeLiquidityAndSize(
      ccxtInstance,
      symbol,
      currentPrice,
      leverage,
      availableBalance,
      isLong,
      stopLossPrice,
    );
  } catch (error) {
    console.error("Failed to analyze liquidity:", error);
    return null;
  }
};