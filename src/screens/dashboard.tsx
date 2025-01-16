import { Button } from "@/components/ui/button";
import { openPopupPanel, openSidePanel } from "@/lib/utils";
import { useNavigate } from "react-router";

const Dashboard = () => {
  const navigate = useNavigate();
  return (
    <>
      Dashboard.tsx
      <Button onClick={() => navigate("/accounts")}>accounts</Button>
      <Button onClick={() => navigate("/setup")}>setup</Button>
      <Button onClick={() => navigate("/search")}>search</Button>
      <Button onClick={openPopupPanel}>openPopupPanel</Button>
      <Button onClick={openSidePanel}>openSidePanel</Button>
    </>
  );
};
export default Dashboard;
