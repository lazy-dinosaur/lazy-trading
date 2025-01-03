import { LoadingSpinner } from "@/components/Loading";
import PopupContainer from "@/components/PopupContainer";
import { ScreenWrapper } from "@/components/ScreenContainer";

const Index = () => {
  return (
    <PopupContainer>
      <ScreenWrapper className={["w-full min-h-full h-full"]}>
        <LoadingSpinner />
      </ScreenWrapper>
    </PopupContainer>
  );
};
export default Index;
