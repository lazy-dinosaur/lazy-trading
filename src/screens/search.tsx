import Locked from "@/components/Locked";
import PopupContainer from "@/components/PopupContainer";
import { usePin } from "@/hooks/usePin";

const Search = () => {
  const { pin, isLoading } = usePin();
  console.log(pin);
  return (
    <PopupContainer>
      {!isLoading && pin ? <>search</> : <Locked />}
    </PopupContainer>
  );
};
export default Search;
