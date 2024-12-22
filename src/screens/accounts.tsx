import PopupContainer from "@/components/PopupContainer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
const Accounts = () => {
  const navigate = useNavigate();

  return (
    <PopupContainer>
      <>
        accounts.tsx
        <Button onClick={() => navigate("/accounts")}>accounts</Button>
        <Button onClick={() => navigate("/trade")}>trade</Button>
        <Button onClick={() => navigate("/setup")}>setup</Button>
        <Button onClick={() => navigate("/search")}>search</Button>
      </>
    </PopupContainer>
  );
};
export default Accounts;
