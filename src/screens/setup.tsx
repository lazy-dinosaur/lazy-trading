import { useEffect } from "react";
import { usePin } from "@/hooks/usePin";
import { useNavigate } from "react-router";
import Pin from "@/components/setup/Pin";
import SetApi from "@/components/setup/SetApi";
import PopupContainer from "@/components/PopupContainer";
import { useAccounts } from "@/hooks/useAccounts";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const Setup = () => {
  const { pin, pinCreated, isLoading: isPinLoading } = usePin();
  const { accounts, isLoading: isAccountsLoading } = useAccounts();

  const navigation = useNavigate();

  useEffect(() => {
    if (
      !isPinLoading &&
      !isAccountsLoading &&
      pinCreated &&
      !!pin &&
      !!accounts?.keys
    ) {
      navigation("/search");
    }
    console.log(!!pinCreated && !!pin);
  }, [pin, pinCreated, isPinLoading, navigation, accounts, isAccountsLoading]);

  return (
    <PopupContainer className="flex-col space-y-5">
      <div className="self-start space-y-2 mx-2">
        <h1 className="text-xl ">Initial Setup</h1>
        <div className="flex items-center space-x-2">
          <Checkbox id="1step" checked={true} disabled />
          <Label
            htmlFor="1step"
            className={cn(`${pinCreated ? "line-through text-gray-400" : ""}`)}
          >
            Create PIN Number
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="2step" checked={pinCreated} disabled />
          <Label
            htmlFor="2step"
            className={cn(
              `${!!accounts?.keys && pinCreated ? "line-through text-gray-400" : ""}`,
            )}
          >
            Setup Your First API key
          </Label>
        </div>
      </div>
      {!pin && !pinCreated && !isPinLoading && !isAccountsLoading ? (
        <Pin />
      ) : (
        <SetApi />
      )}
    </PopupContainer>
  );
};
export default Setup;
