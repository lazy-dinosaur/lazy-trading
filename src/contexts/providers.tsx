import { ReactNode } from "react";
import { PinProvider } from "./pin";
import { CCXTProvider } from "./ccxt";
import { AccountsProvider } from "./accounts";
import { CacheProvider } from "./cache";
import { TradingConfigProvider } from "./settings";
import { SettingsProvider } from "./settings";
import { AnalyticsProvider } from "./analytics/context";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <AnalyticsProvider>
      <SettingsProvider>
        <TradingConfigProvider>
          <CCXTProvider>
            <PinProvider>
              <CacheProvider>
                <AccountsProvider>{children}</AccountsProvider>
              </CacheProvider>
            </PinProvider>
          </CCXTProvider>
        </TradingConfigProvider>
      </SettingsProvider>
    </AnalyticsProvider>
  );
};
export default Providers;