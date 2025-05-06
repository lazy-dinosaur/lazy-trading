import { ExchangeType } from "@/lib/accounts";
import { PositionInfo } from "@/lib/trade";
import { useMutation } from "@tanstack/react-query";
import { binance, bitget, bybit } from "ccxt";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface TradeParams {
  ccxtInstance: binance | bitget | bybit;
  symbol: string;
  tradeType: "long" | "short";
  exchange: ExchangeType;
  info: PositionInfo;
  config: {
    partialClose: boolean;
    closeRatio: number;
    risk: number;
    riskRatio: number;
  };
}

async function executeTrade({
  ccxtInstance,
  symbol,
  tradeType,
  exchange,
  info,
  config,
}: TradeParams, t: (key: string, options?: any) => string) {
  if (!info.position) throw new Error("Position info is required");

  // 토스트 알림 ID 생성 (진행 중 상태 표시용)
  const toastId = toast.loading(
    t('toast.position_creating', { type: t(tradeType === "long" ? 'trade.long' : 'trade.short') }),
    {
      position: "bottom-center",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    },
  );

  try {
    const isusdt = symbol.split(":")[1] === "USDT";
    const side = tradeType === "long" ? "buy" : "sell";
    const oppside = tradeType === "long" ? "sell" : "buy";

    // Set common configurations
    try {
      await ccxtInstance.setLeverage(info.calculatedLeverage, symbol);
    } catch (error) {
      console.warn("Failed to set leverage:", error);
    }

    try {
      await ccxtInstance.setMarginMode("cross", symbol);
    } catch (error) {
      console.warn("Failed to set margin mode:", error);
    }

    // 계정의 포지션 모드 설정 가져오기
    const positionMode = info.account?.positionMode || "oneway";
    const isHedgeMode = positionMode === "hedge";
    
    console.log(`[Debug] Account position mode: ${positionMode} for ${exchange}`);

    // Set exchange-specific configurations
    if (exchange === "binance") {
      try {
        // 바이낸스는 현재 원웨이 모드만 지원
        
        // 헷지 모드로 설정된 계정이 있는 경우 경고 메시지 표시
        if (isHedgeMode) {
          console.warn("[Binance] Hedge mode is not supported, using one-way mode instead");
          toast(t('toast.binance_oneway_mode_warning'), {
            duration: 5000,
            icon: "⚠️",
            style: {
              borderRadius: "10px",
              background: "#fcd34d",
              color: "#92400e",
            },
          });
        }
        
        // 항상 원웨이 모드로 설정
        await (ccxtInstance as binance).fapiPrivatePostPositionSideDual({
          dualSidePosition: "false", // 항상 false(원웨이 모드)로 설정
        });
        console.log(`[Binance] Set position mode to one-way mode`);
      } catch (error) {
        console.warn("Failed to set position mode:", error);
      }

      try {
        // Enable multi-assets mode (멀티에셋 모드)
        await (ccxtInstance as binance).fapiPrivatePostMultiAssetsMargin({
          multiAssetsMargin: "true",
        });
      } catch (error) {
        console.warn("Failed to set multi-assets mode:", error);
      }
    } else {
      try {
        // 계정 설정에 따라 헷지모드 또는 원웨이모드 설정
        await ccxtInstance.setPositionMode(isHedgeMode, symbol);
        console.log(`[${exchange}] Set position mode to ${isHedgeMode ? "hedge" : "one-way"} for ${symbol}`);
      } catch (error) {
        console.warn(`Failed to set position mode for ${symbol}:`, error);
      }
    }

    // Execute orders based on the exchange
    const amount = isusdt ? info.position.size : info.position.size / 100;

    let result;
    if (exchange === "binance") {
      // 바이낸스 주문 실행 - 항상 원웨이모드 사용
      // 원웨이모드 주문
      result = await Promise.all([
        ccxtInstance.createOrder(symbol, "market", side, amount, undefined, {
          marginMode: "cross",
        }),
        ccxtInstance.createOrder(symbol, "market", oppside, amount, undefined, {
          marginMode: "cross",
          reduceOnly: true,
          stopLossPrice: info.stoploss.price,
        }),
        ccxtInstance.createOrder(
          symbol,
          "limit",
          oppside,
          config.partialClose ? amount * (config.closeRatio / 100) : amount,
          info.target.price,
          {
            marginMode: "cross",
            reduceOnly: true,
            takeProfitPrice: info.target.price,
          },
        ),
      ]);
      console.log(`[Binance] Created one-way mode ${tradeType} orders for ${symbol}`);
    } else if (exchange === "bybit") {
      // 마켓 타입 확인 (USDT 마켓인지 인버스 마켓인지)
      const isUSDTMarket = symbol.includes("USDT");

      let positionIdx = 0; // 기본값: 단방향 모드

      // 인버스 마켓은 항상 단방향 모드 사용, USDT 마켓은 계정 설정에 따라 결정
      if (isUSDTMarket && isHedgeMode) {
        // 헷지 모드에서는 long=1, short=2 (USDT 마켓에서만 적용)
        positionIdx = tradeType === "long" ? 1 : 2;
        console.log(
          `[Bybit] Using hedge mode with positionIdx: ${positionIdx} for ${tradeType} position on USDT market`,
        );
      } else {
        console.log(
          `[Bybit] Using one-way mode with positionIdx: 0 ${!isUSDTMarket ? "(inverse market)" : ""}`,
        );
      }

      // 포지션 모드 설정 시도 (USDT 마켓에서만)
      if (isUSDTMarket) {
        try {
          await ccxtInstance.setPositionMode(isHedgeMode, symbol);
          console.log(
            `[Bybit] Successfully set position mode to ${isHedgeMode ? "hedge" : "one-way"} for ${symbol}`,
          );
        } catch (error) {
          console.warn(
            `[Warning] Failed to set position mode for ${symbol}:`,
            error,
          );
        }
      } else {
        console.log(
          `[Bybit] Skipping position mode setting for inverse market ${symbol}`,
        );
      }

      result = await Promise.all([
        // 진입 주문
        ccxtInstance.createOrder(
          symbol,
          "market",
          side,
          info.position.size,
          undefined,
          {
            positionIdx, // 포지션 모드에 따라 동적으로 설정
            // stopLoss 파라미터는 진입 주문과 분리하는 것이 더 안정적일 수 있으나, 일단 유지
            stopLoss: {
              triggerPrice: info.stoploss.price,
            },
          },
        ),
        // 익절 주문 (reduceOnly)
        ccxtInstance.createOrder(
          symbol,
          "limit",
          oppside,
          config.partialClose
            ? info.position.size * (config.closeRatio / 100)
            : info.position.size,
          info.target.price,
          {
            positionIdx, // 포지션 모드에 따라 동적으로 설정
            reduceOnly: true,
          },
        ),
      ]);
    } else if (exchange === "bitget") {
      // 비트겟은 원웨이 모드만 지원하도록 설정
      const isBitgetHedgeMode = false; // 항상 원웨이 모드 사용
      
      // 헷지 모드로 설정된 경우 경고 메시지 표시
      if (isHedgeMode) {
        console.warn("[Bitget] Hedge mode is not supported, using one-way mode instead");
        toast(t('toast.bitget_oneway_mode_warning'), {
          duration: 5000,
          icon: "⚠️",
          style: {
            borderRadius: "10px",
            background: "#fcd34d",
            color: "#92400e",
          },
        });
      }
      
      result = await Promise.all([
        ccxtInstance.createOrder(
          symbol,
          "market",
          side,
          info.position.size,
          undefined,
          {
            stopLoss: {
              triggerPrice: info.stoploss.price,
            },
            hedged: isBitgetHedgeMode, // 항상 false(원웨이 모드)로 설정
          },
        ),
        ccxtInstance.createOrder(
          symbol,
          "limit",
          oppside,
          config.partialClose
            ? info.position.size * (config.closeRatio / 100)
            : info.position.size,
          info.target.price,
          {
            holdSide: tradeType,
            reduceOnly: true,
            hedged: isBitgetHedgeMode, // 항상 false(원웨이 모드)로 설정
          },
        ),
      ]);
      console.log(`[Bitget] Using one-way mode for ${tradeType} position on ${symbol}`);
    } else {
      throw new Error(t('toast.unsupported_exchange', { exchange }));
    }

    // 성공 메시지 표시
    toast.success(
      t('toast.position_created_success', { 
        symbol, 
        type: t(tradeType === "long" ? 'trade.long' : 'trade.short') 
      }),
      {
        id: toastId,
        icon: "✅",
        style: {
          borderRadius: "10px",
          background: tradeType === "long" ? "#10b981" : "#ef4444",
          color: "#fff",
        },
      },
    );

    return result;
  } catch (error) {
    console.error("Order execution failed:", error);

    // 오류 메시지 표시
    toast.error(
      t('toast.order_execution_failed', {
        error: error instanceof Error ? error.message : t('toast.unknown_error')
      }),
      {
        id: toastId,
        icon: "❌",
        duration: 5000,
        style: {
          borderRadius: "10px",
          background: "#f43f5e",
          color: "#fff",
        },
      },
    );

    throw error;
  }
}

export function useTradeMutation() {
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: async (variables: TradeParams) => {
      return executeTrade(variables, t);
    },
    onMutate: (variables: TradeParams) => {
      // 로딩 시작 시 콜백
      console.log(
        `Starting ${variables.tradeType} position creation for ${variables.symbol}`,
      );
    },
  });
}
