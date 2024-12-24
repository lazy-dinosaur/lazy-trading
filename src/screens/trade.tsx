import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
const Trade = () => {
  const navigate = useNavigate();
  return (
    <>
      Trade.tsx
      <Button onClick={() => navigate("/accounts")}>accounts</Button>
      <Button onClick={() => navigate("/trade")}>trade</Button>
      <Button onClick={() => navigate("/setup")}>setup</Button>
      <Button onClick={() => navigate("/search")}>search</Button>
    </>
  );
};
export default Trade;
