import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
const Trade = () => {
  const navigate = useNavigate();
  return (
    <div>
      Trade.tsx
      <Button onClick={() => navigate("/accounts")}>accounts</Button>
      <Button onClick={() => navigate("/trade")}>trade</Button>
      <Button onClick={() => navigate("/setup")}>setup</Button>
      <Button onClick={() => navigate("/search")}>search</Button>
    </div>
  );
};
export default Trade;
