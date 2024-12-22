import Locked from "@/components/Locked";
import PopupContainer from "@/components/PopupContainer";
import { usePin } from "@/hooks/usePin";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";

export default function Protector() {
  const { pin, isLoading } = usePin();
  const location = useLocation();

  useEffect(() => {
    console.log(location);
  }, [location]);

  return (
    <PopupContainer>
      {!isLoading && !pin ? <Locked /> : <Outlet />}
    </PopupContainer>
  );
}
