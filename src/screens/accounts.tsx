import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
const Accounts = () => {
  const navigate = useNavigate();

  return (
    <>
      accounts.tsx
      <Button onClick={() => navigate("/accounts")}>accounts</Button>
      <Button onClick={() => navigate("/trade")}>trade</Button>
      <Button onClick={() => navigate("/setup")}>setup</Button>
      <Button onClick={() => navigate("/search")}>search</Button>
    </>
  );
};
export default Accounts;
