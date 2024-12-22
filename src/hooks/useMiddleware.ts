import { useLocation, useNavigate } from "react-router";
import { useAppStateCache } from "./useAppStateCache";
import { usePin } from "./usePin";
import { useAccounts } from "./useAccounts";
import { useEffect } from "react";

export const useMiddleware = () => {
  const location = useLocation();
  const { isLoaded } = useAppStateCache();
  const { setPin, pinCreated, setPinCreated } = usePin();
  const { accounts, deleteAllAccounts, isLoading } = useAccounts();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isLoading) {
      if (
        location.pathname != "/setup" &&
        (!pinCreated || (accounts && Object.keys(accounts).length == 0))
      ) {
        deleteAllAccounts();
        setPinCreated(false);
        setPin(null as any);
        navigate("/setup");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, isLoading]);

  return {};
};
