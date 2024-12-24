import { Button } from "@/components/ui/button";
import useExchange from "@/hooks/useExchange";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Search = () => {
  const navigate = useNavigate();
  const { exchangeData } = useExchange();

  useEffect(() => {
    console.log(exchangeData.data);
  }, [exchangeData]);

  return (
    <>
      <Button onClick={() => navigate("/")}>dashboard</Button>
      <Button onClick={() => navigate("/accounts")}>accounts</Button>
      <Button onClick={() => navigate("/trade")}>trade</Button>
      <Button onClick={() => navigate("/setup")}>setup</Button>
      <Button onClick={() => navigate("/search")}>search</Button>
    </>
  );
};
export default Search;
