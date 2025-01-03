import { usePin } from "@/hooks/usePin";
import Pin from "@/components/setup/Pin";
import SetApi from "@/components/setup/SetApi";
import { useAccounts } from "@/hooks/useAccounts";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import PopupContainer from "@/components/PopupContainer";

const Setup = () => {
  const { pin, pinCreated } = usePin();
  const { accounts } = useAccounts();

  return (
    <PopupContainer className="flex-col space-y-5">
      <div className="h-full self-start space-y-5 p-4">
        <div className="self-start space-y-2 mx-2">
          <h1 className="text-xl ">Initial Setup</h1>
          <div className="flex items-center space-x-2">
            <Checkbox id="1step" checked={true} disabled />
            <Label
              htmlFor="1step"
              className={cn(
                `${pinCreated ? "line-through text-gray-400" : ""}`,
              )}
            >
              Create PIN Number
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="2step" checked={pinCreated} disabled />
            <Label
              htmlFor="2step"
              className={cn(
                `${!!accounts?.keys && Object.keys(accounts).length > 0 && pinCreated ? "line-through text-gray-400" : ""}`,
              )}
            >
              Setup Your First API key
            </Label>
          </div>
        </div>
        {!pin && !pinCreated ? <Pin /> : <SetApi />}
      </div>
    </PopupContainer>
  );
};
export default Setup;
