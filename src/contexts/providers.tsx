import { ReactNode } from "react";
import { PinProvider } from "./pin";
import { CCXTProvider } from "./ccxt";
import { AccountsProvider } from "./accounts";
import { CacheProvider } from "./cache";

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
