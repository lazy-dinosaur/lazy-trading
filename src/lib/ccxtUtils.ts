import { CandleData } from "@/components/chart/candle";
import { TimeFrameType } from "@/components/trade/time-frame";
import { ExchangeType } from "@/hooks/useAccounts";
import ccxt, {
  Balance,
  Balances,
  Exchange,
  Order,
  Position,
  Ticker,
} from "ccxt";
import { MutableRefObject } from "react";
import { DecryptedAccount } from "./appStorage";

export const formatTime = (timestamp: number, timeFrame: TimeFrameType) => {
  const date = new Date(timestamp * 1000);

  switch (timeFrame) {
    case "1":
    case "5":
    case "15":
    case "30":
    case "60":
    case "240":
      // 분봉, 시간봉은 날짜와 시간 모두 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
      };

    case "D":
    case "W":
    case "M":
      // 일봉, 주봉, 월봉은 날짜만 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };

    default:
      return date.toISOString().split("T")[0];
  }
};

/**
 * 최근 캔들 데이터에서 손절 기준이 되는 고점/저점을 찾는 함수
 * @param data - 캔들 데이터 배열
 * @param arrLen - 현재 검색할 배열의 길이
 * @param tradeType - 'high' 또는 'low'
 * @returns 손절 기준이 되는 캔들 데이터
 */
export const searchingStopLossCandle = (
  data: CandleData[],
  arrLen: number,
  tradeType: "high" | "low",
): CandleData => {
  // 최근 3개의 캔들 값을 저장할 배열
  const candles: number[] = [];

  // 최근 3개의 캔들에서 고점 또는 저점 값을 수집
  for (let i = 0; i < 3; i++) {
    if (arrLen - i >= 0 && data[arrLen - i]) {
      candles.push(data[arrLen - i][tradeType]);
    }
  }

  // 배열이 비어있으면 마지막 캔들 반환
  if (candles.length === 0) {
    return data[data.length - 1];
  }

  // 고점/저점의 인덱스 찾기
  let extremeIndex: number;
  if (tradeType === "low") {
    // 저점인 경우 최소값의 인덱스
    extremeIndex = candles.indexOf(Math.min(...candles));
  } else {
    // 고점인 경우 최대값의 인덱스
    extremeIndex = candles.indexOf(Math.max(...candles));
  }

  // 현재 구간의 첫 번째 캔들이 고점/저점인 경우
  if (extremeIndex === 0) {
    // 해당 값을 가진 캔들들 중 가장 최근 캔들 찾기
    const matchingCandles = data.filter(
      (candle) => candle[tradeType] === candles[extremeIndex],
    );
    return matchingCandles[matchingCandles.length - 1];
  }

  // 고점/저점이 첫 번째 캔들이 아닌 경우 재귀적으로 이전 구간 검색
  return searchingStopLossCandle(data, arrLen - extremeIndex, tradeType);
};

/**
 * 차트에 표시할 마커 데이터 생성
 */
export const getStopLossMarkers = (data: CandleData[]) => {
  if (data.length < 3) return [];

  const highMarker = searchingStopLossCandle(data, data.length - 1, "high");
  const lowMarker = searchingStopLossCandle(data, data.length - 1, "low");

  return [
    {
      time: highMarker.time,
      position: "aboveBar" as const,
      color: "#ef4444",
      shape: "arrowDown" as const,
      text: `High: ${highMarker.high.toFixed(2)}`,
    },
    {
      time: lowMarker.time,
      position: "belowBar" as const,
      color: "#22c55e",
      shape: "arrowUp" as const,
      text: `Low: ${lowMarker.low.toFixed(2)}`,
    },
  ];
};

export interface BalanceMutationParams {
  exchange: ExchangeType;
  apikey: string;
  secret: string;
}

export interface TickerWithExchange extends Ticker {
  exchange: ExchangeType;
}

export interface ExchangeInstances {
  [key: string]: {
    ccxt: Exchange;
    pro: Exchange;
  };
}
export const createExchangeInstances = (): ExchangeInstances => ({
  bybit: {
    ccxt: new ccxt.bybit(),
    pro: new ccxt.pro.bybit(),
  },
  binance: {
    ccxt: new ccxt.binance(),
    pro: new ccxt.pro.binance(),
  },
  bitget: {
    ccxt: new ccxt.bitget({
      password: "lazytrading",
    }),
    pro: new ccxt.pro.bitget({
      password: "lazytrading",
    }),
  },
});

export const getHistoricalRange = (
  exchange: ExchangeType,
  timeFrame: TimeFrameType,
) => {
  const timeframeMs = getTimeframeMilliseconds(timeFrame);
  const defaultRange = timeframeMs * 250;

  switch (exchange) {
    case "binance":
      // 바이낸스는 최대 200일까지만 허용
      return Math.min(defaultRange, 200 * 24 * 60 * 60 * 1000);
    case "bitget":
      // bitget은 최대 90일까지만 허용
      return Math.min(defaultRange, 90 * 24 * 60 * 60 * 1000);
    default:
      return defaultRange;
  }
};

export const getTimeframeMilliseconds = (timeFrame: TimeFrameType) => {
  switch (timeFrame) {
    case "D":
      return 24 * 60 * 60 * 1000; // 1일
    case "W":
      return 7 * 24 * 60 * 60 * 1000; // 1주
    case "M":
      return 30 * 24 * 60 * 60 * 1000; // 약 1달
    default:
      return parseInt(timeFrame) * 60 * 1000; // 분 단위
  }
};

const getFormattedTimeframe = (
  exchange: ExchangeType,
  timeFrame: TimeFrameType,
) => {
  switch (exchange) {
    case "binance":
      switch (timeFrame) {
        case "60":
          return "1h";
        case "240":
          return "4h";
        case "D":
          return "1d"; // 일봉
        case "W":
          return "1w"; // 주봉
        case "M":
          return "1M"; // 월봉
        default:
          return `${timeFrame}m`;
      }
    case "bybit":
      switch (timeFrame) {
        case "D":
          return "D";
        case "W":
          return "W";
        case "M":
          return "M";

        default:
          return timeFrame;
      }

    case "bitget":
      switch (timeFrame) {
        case "60":
          return "1h";
        case "240":
          return "4h";
        case "D":
          return "1d"; // 일봉
        case "W":
          return "1w"; // 주봉
        case "M":
          return "1M"; // 월봉
        default:
          return `${timeFrame}m`;
      }
    default:
      return timeFrame;
  }
};

export const fetchTicker = async ({
  exchangeData,
  exchange,
  symbol,
}: {
  exchangeData?: ExchangeInstances;
  exchange: ExchangeType;
  symbol: string;
}) => {
  if (!exchangeData || !exchangeData[exchange]) {
    throw new Error("Exchange instances not initialized");
  }
  const exchangeInstance = exchangeData[exchange].ccxt;
  const ticker = await exchangeInstance.fetchTicker(symbol);
  return { ...ticker, exchange };
};
export const fetchHistoricalOHLCV = async ({
  pageParam,
  exchangeData,
  exchange,
  timeFrame,
  symbol,
}: {
  pageParam: number;
  exchangeData?: ExchangeInstances;
  exchange: ExchangeType;
  timeFrame: TimeFrameType;
  symbol: string;
}) => {
  if (!exchangeData || !exchangeData[exchange]) {
    throw new Error("Exchange instances not initialized");
  }
  const exchangeInstance = exchangeData[exchange].pro;
  const until = pageParam as number;
  const range = getHistoricalRange(exchange, timeFrame);
  const since = until - range;

  try {
    const formattedTimeframe = getFormattedTimeframe(exchange, timeFrame);

    const OHLCV = await exchangeInstance.fetchOHLCV(
      symbol,
      formattedTimeframe,
      since,
      250,
      {
        until,
        ...(exchange === "binance" && {
          limit: 250,
          // 바이낸스의 경우 endTime도 추가
          endTime: until,
        }),
        ...(exchange === "bitget" && {
          endTime: until,
          limit: 250,
        }),
        ...(exchange === "bybit" && {
          limit: 250,
        }),
      },
    );

    if (!OHLCV || OHLCV.length === 0) {
      return {
        data: [],
        nextCursor: undefined,
      };
    }

    const formattedData = OHLCV.map((candle) => ({
      time: (candle[0] as number) / 1000,
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    })) as CandleData[];

    return {
      data: formattedData,
      nextCursor: formattedData[0]?.time
        ? (formattedData[0].time as number) * 1000
        : undefined,
    };
  } catch (error) {
    console.error(`Error fetching OHLCV for ${exchange}:`, error);
    return {
      data: [],
      nextCursor: undefined,
    };
  }
};
export const fetchRealtimeOHLCV = async ({
  exchangeData,
  exchange,
  timeFrame,
  symbol,
}: {
  exchangeData?: ExchangeInstances;
  exchange: ExchangeType;
  timeFrame: TimeFrameType;
  symbol: string;
}) => {
  if (!exchangeData || !exchangeData[exchange]) {
    throw new Error("Exchange instances not initialized");
  }
  const exchangeInstance = exchangeData[exchange].pro;
  const now = Date.now();
  const timeframeMs = getTimeframeMilliseconds(timeFrame);
  const since = now - timeframeMs * 2;

  try {
    const formattedTimeframe = getFormattedTimeframe(exchange, timeFrame);

    const OHLCV = await exchangeInstance.fetchOHLCV(
      symbol,
      formattedTimeframe,
      since,
      2,
      {
        // 거래소별 추가 옵션
        ...(exchange === "binance" && { limit: 2 }),
        ...(exchange === "bitget" && {
          endTime: now,
          limit: 2,
        }),
        ...(exchange === "bybit" && {
          limit: 2,
        }),
      },
    );

    if (!OHLCV || OHLCV.length === 0) {
      return [];
    }

    return OHLCV.map((candle) => ({
      time: (candle[0] as number) / 1000,
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    })) as CandleData[];
  } catch (error) {
    console.error(`Error fetching realtime OHLCV for ${exchange}:`, error);
    return [];
  }
};
export const fetchAllTickers = async ({
  exchangeInstancesRef,
}: {
  exchangeInstancesRef: MutableRefObject<ExchangeInstances | null>;
}) => {
  if (!exchangeInstancesRef.current) {
    throw new Error("Exchange instances not initialized");
  }

  const { bybit, binance, bitget } = exchangeInstancesRef.current;

  const [
    bybitInverseTickers,
    bybitLinearTickers,
    binanceInverseTickers,
    binanceLinearTickers,
    bitgetInverseTickers,
    bitgetLinearTickers,
  ] = await Promise.all([
    bybit.ccxt.fetchTickers(undefined, {
      type: "swap",
      subType: "inverse",
    }),
    bybit.ccxt.fetchTickers(undefined, {
      type: "swap",
      subType: "linear",
    }),
    binance.ccxt.fetchTickers(undefined, {
      type: "swap",
      subType: "inverse",
    }),
    binance.ccxt.fetchTickers(undefined, {
      type: "swap",
      subType: "linear",
    }),
    bitget.ccxt.fetchTickers(undefined, {
      type: "swap",
      subType: "inverse",
    }),
    bitget.ccxt.fetchTickers(undefined, {
      type: "swap",
      subType: "linear",
    }),
  ]);

  const tickers: TickerWithExchange[] = [
    ...Object.values(bybitInverseTickers)
      .filter(
        (ticker) =>
          !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
      )
      .map((ticker) => ({
        ...ticker,
        exchange: "bybit" as ExchangeType,
      })),
    ...Object.values(bybitLinearTickers)
      .filter(
        (ticker) =>
          !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
      )
      .map((ticker) => ({
        ...ticker,
        exchange: "bybit" as ExchangeType,
      })),
    ...Object.values(binanceInverseTickers)
      .filter(
        (ticker) =>
          !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
      )
      .map((ticker) => ({
        ...ticker,
        exchange: "binance" as ExchangeType,
      })),
    ...Object.values(binanceLinearTickers)
      .filter(
        (ticker) =>
          !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
      )
      .map((ticker) => ({
        ...ticker,
        exchange: "binance" as ExchangeType,
      })),

    ...Object.values(bitgetInverseTickers)
      .filter(
        (ticker) =>
          !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
      )
      .map((ticker) => ({
        ...ticker,
        exchange: "bitget" as ExchangeType,
      })),
    ...Object.values(bitgetLinearTickers)
      .filter(
        (ticker) =>
          !ticker.symbol.includes("-") && !ticker.symbol.includes("_"),
      )
      .map((ticker) => ({
        ...ticker,
        exchange: "bitget" as ExchangeType,
      })),
  ];

  return tickers;
};
export const fetchAllMarkets = async ({
  exchangeInstancesRef,
}: {
  exchangeInstancesRef: MutableRefObject<ExchangeInstances | null>;
}) => {
  if (!exchangeInstancesRef.current) {
    throw new Error("Exchange instances not initialized");
  }
  const { bybit, binance, bitget } = exchangeInstancesRef.current;
  const bybitMarket = await bybit.ccxt.fetchMarkets();
  const binanceMarket = await binance.ccxt.fetchMarkets();
  const bitgetMarket = await bitget.ccxt.fetchMarkets();
  return {
    bybit: bybitMarket,
    binance: binanceMarket,
    bitget: bitgetMarket,
  };
};
export const fetchValid = async ({
  exchangeInstancesRef,
  exchange,
  apikey,
  secret,
}: BalanceMutationParams & {
  exchangeInstancesRef: MutableRefObject<ExchangeInstances | null>;
}) => {
  if (!exchangeInstancesRef.current) {
    throw new Error("Exchange instances not initialized");
  }

  const exchangeInstance = exchangeInstancesRef.current[exchange].ccxt;
  exchangeInstance.apiKey = apikey;
  exchangeInstance.secret = secret;
  exchangeInstance.password = "lazytrading";

  return await exchangeInstance.fetchBalance();
};

interface USDBalance {
  total: number;
  used: number;
  free: number;
}
export type BalancesType = Balances &
  Balance & {
    [keyof: string]: any;
    usd: USDBalance;
  };

async function calculateUSDBalance(
  exchange: Exchange,
  balance: Balances,
): Promise<USDBalance> {
  const usdBalance: USDBalance = {
    total: 0,
    used: 0,
    free: 0,
  };

  try {
    const assets = Object.entries(balance).filter(
      ([, value]) => (value.free ?? 0) > 0 || (value.used ?? 0) > 0,
    );

    await Promise.all(
      assets.map(async ([currency, value]) => {
        try {
          let price = 1; // USDT/USD의 경우 기본값 1

          if (currency !== "USDT" && currency !== "USD") {
            try {
              const ticker = await exchange.fetchTicker(`${currency}/USDT`);
              if (ticker && ticker.last) {
                price = ticker.last;
              }
            } catch {
              // USDT 마켓이 없는 경우 USD 마켓 시도
              try {
                const ticker = await exchange.fetchTicker(`${currency}/USD`);
                if (ticker && ticker.last) {
                  price = ticker.last;
                }
              } catch {
                console.warn(`No USD/USDT market found for ${currency}`);
                return; // 이 자산은 건너뜀
              }
            }
          }

          usdBalance.free += (value.free || 0) * price;
          usdBalance.used += (value.used || 0) * price;
          usdBalance.total += (value.total || 0) * price;
        } catch (error) {
          console.warn(`Failed to calculate USD value for ${currency}:`, error);
        }
      }),
    );
  } catch (error) {
    console.error("Error calculating USD balance:", error);
  }

  // 소수점 2자리까지 반올림
  return {
    total: Math.round(usdBalance.total * 100) / 100,
    used: Math.round(usdBalance.used * 100) / 100,
    free: Math.round(usdBalance.free * 100) / 100,
  };
}
export type AccountInfo = {
  balance: BalancesType;
  positions: Position[];
  positionsHistory: Position[];
  orders: {
    open: Order[];
    closed: Order[];
  };
};

export type AccountInfoType = {
  [keyof: string]: AccountInfo;
};
export const fetchAccountInfo = async (
  decryptedAccounts:
    | {
        [key: string]: DecryptedAccount;
      }
    | undefined,
  exchangeData: any,
  tickerData: TickerWithExchange[] | undefined,
) => {
  if (!decryptedAccounts || !exchangeData || !tickerData) {
    throw new Error("Accounts or exchange data not available");
  }

  const accountsInfo: AccountInfoType = {};
  const accounts = Object.values(decryptedAccounts);

  // Promise.all을 사용하여 모든 비동기 작업이 완료될 때까지 대기
  await Promise.all(
    accounts.map(async (account) => {
      try {
        const exchangeInstance = exchangeData[account.exchange].pro;
        exchangeInstance.apiKey = account.apiKey;
        exchangeInstance.secret = account.secretKey;

        const rawBalance = await exchangeInstance.fetchBalance();
        const usdBalance = await calculateUSDBalance(
          exchangeInstance,
          rawBalance,
        );
        const positions = await exchangeInstance.fetchPositions();
        // 다른 거래소는 기존 방식대로 처리
        //
        const closed = await exchangeInstance.fetchClosedOrders(
          undefined,
          undefined,
          100,
        );
        const open = await exchangeInstance.fetchOpenOrders(
          undefined,
          undefined,
          100,
        );
        const positionsHistory = await exchangeInstance.fetchPositionsHistory();

        // 원래 balance 정보와 USD 환산 정보를 합침
        const balance = {
          ...rawBalance,
          usd: usdBalance,
        } as BalancesType;
        console.log(balance);

        accountsInfo[account.id] = {
          balance,
          positions,
          positionsHistory,
          orders: {
            open,
            closed,
          },
        };
      } catch (error) {
        console.error(
          `Error fetching balance for account ${account.id}:`,
          error,
        );
        // 에러가 발생해도 다른 계정의 정보는 계속 가져올 수 있도록 함
        accountsInfo[account.id] = {
          balance: {} as BalancesType,
          positions: [] as Position[],
          positionsHistory: [] as Position[],
          orders: {
            open: [] as Order[],
            closed: [] as Order[],
          },
        };
      }
    }),
  );

  return accountsInfo;
};
