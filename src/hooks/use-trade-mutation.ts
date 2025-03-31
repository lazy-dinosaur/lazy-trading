import { ExchangeType } from "@/lib/accounts";
import { PositionInfo } from "@/lib/trade";
import { useMutation } from "@tanstack/react-query";
import { binance, bitget, bybit } from "ccxt";
import toast from "react-hot-toast";

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
}: TradeParams) {
  if (!info.position) throw new Error("Position info is required");

  // 토스트 알림 ID 생성 (진행 중 상태 표시용)
  const toastId = toast.loading(
    `${tradeType === "long" ? "롱" : "숏"} 포지션 생성 중...`,
    {
      position: "bottom-center",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    }
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

    // Set exchange-specific configurations
    if (exchange === "binance") {
      try {
        // Enable hedge mode (포지션 모드)
        await (ccxtInstance as binance).fapiPrivatePostPositionSideDual({
          dualSidePosition: "true",
        });
      } catch (error) {
        console.warn("Failed to set hedge mode:", error);
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
        await ccxtInstance.setPositionMode(true, symbol);
      } catch (error) {
        console.warn("Failed to set position mode:", error);
      }
    }

    // Execute orders based on the exchange
    const amount = isusdt ? info.position.size : info.position.size / 100;

    let result;
    if (exchange === "binance") {
      result = await Promise.all([
        ccxtInstance.createOrder(symbol, "market", side, amount, undefined, {
          marginMode: "cross",
          positionSide: tradeType.toUpperCase(),
          hedged: true,
        }),
        ccxtInstance.createOrder(symbol, "market", oppside, amount, undefined, {
          marginMode: "cross",
          reduceOnly: true,
          positionSide: tradeType.toUpperCase(),
          stopLossPrice: info.stoploss.price,
          hedged: true,
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
            positionSide: tradeType.toUpperCase(),
            takeProfitPrice: info.target.price,
            hedged: true,
          }
        ),
      ]);
    } else if (exchange === "bybit") {
      const positionIdx = 0; // 단방향 모드이므로 항상 0
      result = await Promise.all([
        // 진입 주문
        ccxtInstance.createOrder(
          symbol,
          "market",
          side,
          info.position.size,
          undefined,
          {
            positionIdx, // positionIdx: 0 전달
            // stopLoss 파라미터는 진입 주문과 분리하는 것이 더 안정적일 수 있으나, 일단 유지
            stopLoss: {
              triggerPrice: info.stoploss.price,
            },
          }
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
            // positionIdx 제거, reduceOnly만 사용
            reduceOnly: true,
          }
        ),
      ]);
    } else if (exchange === "bitget") {
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
            hedged: true,
          }
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
            hedged: true,
          }
        ),
      ]);
    } else {
      throw new Error(`지원하지 않는 거래소입니다: ${exchange}`);
    }

    // 성공 메시지 표시
    toast.success(
      `${symbol} ${tradeType === "long" ? "롱" : "숏"} 포지션 생성 성공!`,
      {
        id: toastId,
        icon: "✅",
        style: {
          borderRadius: "10px",
          background: tradeType === "long" ? "#10b981" : "#ef4444",
          color: "#fff",
        },
      }
    );

    return result;
  } catch (error) {
    console.error("Order execution failed:", error);

    // 오류 메시지 표시
    toast.error(
      `주문 실행 실패: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
      {
        id: toastId,
        icon: "❌",
        duration: 5000,
        style: {
          borderRadius: "10px",
          background: "#f43f5e",
          color: "#fff",
        },
      }
    );

    throw error;
  }
}

export function useTradeMutation() {
  return useMutation({
    mutationFn: executeTrade,
    onMutate: (variables) => {
      // 로딩 시작 시 콜백
      console.log(
        `Starting ${variables.tradeType} position creation for ${variables.symbol}`
      );
    },
  });
}
