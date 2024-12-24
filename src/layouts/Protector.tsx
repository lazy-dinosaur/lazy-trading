import Header from "@/components/Header";
import Locked from "@/components/Locked";
import PopupContainer from "@/components/PopupContainer";
import { usePin } from "@/hooks/usePin";
import { Outlet } from "react-router";

export default function Protector() {
  const { pin, isLoading } = usePin();

  return (
    <PopupContainer className="flex-col space-y-5">
      <div className="self-start space-y-2 mx-2">
        <Header />
        {!isLoading && !pin ? <Locked /> : <Outlet />}
      </div>
    </PopupContainer>
  );
}
