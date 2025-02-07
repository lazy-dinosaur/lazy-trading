import { ExchangeType } from "@/lib/accounts";
import { useMutation } from "@tanstack/react-query";
import { binance, bitget, bybit } from "ccxt";

interface TradeParams {
  ccxtInstance: binance | bitget | bybit;
  symbol: string;
  tradeType: "long" | "short";
  exchange: ExchangeType;
  info: {
    position?: {
      size: number;
    };
    stoploss: {
      price: number;
    };
    target: {
      price: number;
    };
  };
  config: {
    partialClose: boolean;
    closeRatio: number;
  };
  maxLeverage: number;
}

async function executeTrade({
  ccxtInstance,
  symbol,
  tradeType,
  exchange,
  info,
  config,
  maxLeverage,
}: TradeParams) {
  if (!info.position) throw new Error("Position info is required");

  const isusdt = symbol.split(":")[1] === "USDT";
  const side = tradeType === "long" ? "buy" : "sell";
  const oppside = tradeType === "long" ? "sell" : "buy";

  // Set common configurations

  // Set Binance-specific configurations
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
  try {
    await ccxtInstance.setLeverage(maxLeverage, symbol);
  } catch (error) {
    console.warn("Failed to set leverage:", error);
  }
  try {
    await ccxtInstance.setMarginMode("cross", symbol);
  } catch (error) {
    console.warn("Failed to set margin mode:", error);
  }

  try {
    const amount = isusdt ? info.position.size : info.position.size / 100;
    if (exchange === "binance") {
      return await Promise.all([
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
          },
        ),
      ]);
    }

    if (exchange === "bybit") {
      const positionIdx = isusdt ? (tradeType === "long" ? 1 : 2) : 0;
      return await Promise.all([
        ccxtInstance.createOrder(
          symbol,
          "market",
          side,
          info.position.size,
          undefined,
          {
            positionIdx,
            stopLoss: {
              triggerPrice: info.stoploss.price,
            },
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
            positionIdx,
            reduceOnly: true,
          },
        ),
      ]);
    }

    if (exchange === "bitget") {
      return await Promise.all([
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
            hedged: true,
          },
        ),
      ]);
    }

    throw new Error(`Unsupported exchange: ${exchange}`);
  } catch (error) {
    console.error("Order execution failed:", error);
    throw error;
  }
}

export function useTradeMutation() {
  return useMutation({
    mutationFn: executeTrade,
  });
}
