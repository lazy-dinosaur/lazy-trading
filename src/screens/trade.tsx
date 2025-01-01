import { LoadingSpinner } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import useExchange from "@/hooks/useExchange";
import { useEffect } from "react";
import { useNavigate } from "react-router";
const Trade = () => {
  const navigate = useNavigate();
  const { fetchTicker } = useExchange();
  const { data, isLoading } = fetchTicker;

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    <div className="w-[450px] h-full">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          Trade.tsx
          <Button onClick={() => navigate("/accounts")}>accounts</Button>
          <Button onClick={() => navigate("/trade")}>trade</Button>
          <Button onClick={() => navigate("/setup")}>setup</Button>
          <Button onClick={() => navigate("/search")}>search</Button>
        </>
      )}
    </div>
  );
};
export default Trade;
