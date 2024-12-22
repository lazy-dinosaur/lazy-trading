import PopupContainer from "@/components/PopupContainer";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

const Search = () => {
  const navigate = useNavigate();

  return (
    <PopupContainer>
      <>
        <Button onClick={() => navigate("/")}>dashboard</Button>
        <Button onClick={() => navigate("/accounts")}>accounts</Button>
        <Button onClick={() => navigate("/trade")}>trade</Button>
        <Button onClick={() => navigate("/setup")}>setup</Button>
        <Button onClick={() => navigate("/search")}>search</Button>
      </>
    </PopupContainer>
  );
};
export default Search;
