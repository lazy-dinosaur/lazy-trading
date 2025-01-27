import { ReactNode } from "react";
import { PinProvider } from "./pin";
import { CCXTProvider } from "./ccxt";
import { AccountsProvider } from "./accounts";
import { CacheProvider } from "./cache";
import { TradingConfigProvider } from "./settings";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <TradingConfigProvider>
      <CCXTProvider>
        <PinProvider>
          <CacheProvider>
            <AccountsProvider>{children}</AccountsProvider>
          </CacheProvider>
        </PinProvider>
      </CCXTProvider>
    </TradingConfigProvider>
  );
};
export default Providers;
