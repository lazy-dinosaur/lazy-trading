import { useLocation } from "react-router";

const Header = () => {
  const { pathname } = useLocation();
  const title = pathname.split("/")[1];

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-xl ">{title ? title : "Dashboard"}</h1>
      <div>menu</div>
    </div>
  );
};
export default Header;
