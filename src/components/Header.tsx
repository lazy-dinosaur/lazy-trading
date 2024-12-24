import { useLocation } from "react-router";
import { SidebarTrigger } from "./ui/sidebar";
import { usePin } from "@/hooks/usePin";

const Header = () => {
  const { pathname } = useLocation();
  const title = pathname.split("/")[1];

  const { pin, isLoading } = usePin();

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-xl ">{title ? title : "Dashboard"}</h1>
      {!isLoading && !pin ? "" : <SidebarTrigger />}
    </div>
  );
};
export default Header;
