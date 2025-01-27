import ccxt, {
  bybit as Bybit,
  bitget as Bitget,
  binance as Binance,
  Ticker,
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
