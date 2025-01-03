import { Button } from "@/components/ui/button";
import { useAccounts } from "@/hooks/useAccounts";
import { useNavigate } from "react-router";

const Dashboard = () => {
  const navigate = useNavigate();
  const { deleteAllAccounts } = useAccounts();
  return (
    <>
      Dashboard.tsx
      <Button onClick={() => navigate("/accounts")}>accounts</Button>
      <Button onClick={() => navigate("/trade")}>trade</Button>
      <Button onClick={() => navigate("/setup")}>setup</Button>
      <Button onClick={() => navigate("/search")}>search</Button>
      <Button
        onClick={() => {
          deleteAllAccounts();
          navigate("/setup");
        }}
      >
        deleteAllAccounts
      </Button>
    </>
  );
};
export default Dashboard;
