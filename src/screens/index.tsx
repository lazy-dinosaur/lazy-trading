import { LoadingSpinner } from "@/components/loading";
import PopupContainer from "@/components/popup-container";
import { ScreenWrapper } from "@/components/screen-wrapper";

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
