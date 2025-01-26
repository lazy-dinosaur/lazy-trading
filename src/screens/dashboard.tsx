import { ScreenWrapper } from "@/components/screen-wrapper";
import { Button } from "@/components/ui/button";
import { openPopupPanel, openSidePanel } from "@/lib/utils";
import { useNavigate } from "react-router";

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <ScreenWrapper headerProps={{ title: "Dashboard" }} className={"space-y-5"}>
      Dashboard.tsx
      <Button onClick={() => navigate("/accounts")}>accounts</Button>
      <Button onClick={() => navigate("/account/add")}>setup</Button>
      <Button onClick={() => navigate("/search")}>search</Button>
      <Button onClick={openPopupPanel}>openPopupPanel</Button>
      <Button onClick={openSidePanel}>openSidePanel</Button>
    </ScreenWrapper>
  );
};
export default Dashboard;
