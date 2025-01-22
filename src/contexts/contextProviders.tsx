import { ReactNode } from "react";
import { PinProvider } from "./pin-context";
import { CCXTProvider } from "./ccxt-context";
import { AccountsProvider } from "./accounts-context";

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <CCXTProvider>
      <PinProvider>
        <AccountsProvider>{children}</AccountsProvider>
      </PinProvider>
    </CCXTProvider>
  );
};
export default Providers;
