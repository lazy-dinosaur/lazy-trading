import ccxt, {
  bybit as Bybit,
  bitget as Bitget,
  binance as Binance,
  Ticker,
  Exchange,
} from "ccxt";
import BybitPro from "node_modules/ccxt/js/src/pro/bybit";
import BitgetPro from "node_modules/ccxt/js/src/pro/bitget";
import BinancePro from "node_modules/ccxt/js/src/pro/binance";
import { ExchangeType } from "./accounts";

export interface TickerWithExchange extends Ticker {
  exchange: ExchangeType;
}

export interface ExchangeInstances {
  bybit: {
    ccxt: Bybit;
    pro: BybitPro;
  };
  binance: {
    ccxt: Binance;
    pro: BinancePro;
  };
  bitget: {
    ccxt: Bitget;
    pro: BitgetPro;
  };
}

export const createExchangeInstances = (): ExchangeInstances => ({
  bybit: {
    ccxt: new ccxt.bybit({
      enableRateLimit: true,
    }),
    pro: new ccxt.pro.bybit({
      enableRateLimit: true,
    }),
  },
  binance: {
    ccxt: new ccxt.binance({
      enableRateLimit: true,
    }),
    pro: new ccxt.pro.binance({
      enableRateLimit: true,
    }),
  },
  bitget: {
    ccxt: new ccxt.bitget({
      enableRateLimit: true,
      password: "lazytrading",
    }),
    pro: new ccxt.pro.bitget({
      enableRateLimit: true,
      password: "lazytrading",
    }),
  },
});

export const ccxtHelper = async (
  exchange: ExchangeType,
  apiKey: string,
  secret: string,
  callback: (exchangeInstance: Exchange) => Promise<any>,
) => {
  const exchangeInstance = new ccxt[exchange]({
    apiKey,
    secret,
    enableRateLimit: true,
    options: {
      defaultType: "swap",
    },
  });

  if (exchange !== "bitget") {
    exchangeInstance.setSandboxMode(true);
  }

  if (exchange === "bitget") {
    exchangeInstance.password = "lazytrading";
  } else if (exchange === "binance") {
    exchangeInstance.options.headers = {
      "X-MBX-APIKEY": apiKey,
    };
  }

  try {
    return await callback(exchangeInstance);
  } finally {
    if (exchangeInstance.close) {
      await exchangeInstance.close();
    }
  }
};
