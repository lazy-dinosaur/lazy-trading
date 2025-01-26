import { ReactNode } from "react";
import { PinProvider } from "./pin-context";
import { CCXTProvider } from "./ccxt-context";
import { AccountsProvider } from "./accounts-context";
import { CacheProvider } from "./cache-context";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <CCXTProvider>
      <PinProvider>
        <CacheProvider>
          <AccountsProvider>{children}</AccountsProvider>
        </CacheProvider>
      </PinProvider>
    </CCXTProvider>
  );
};
export default Providers;
