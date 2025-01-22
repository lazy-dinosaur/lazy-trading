import { useContext } from "react";
import { PinContext, VERIFICATION_STRING } from "@/contexts/pin-context-type";

export const usePin = () => {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error("usePin must be used within a PinProvider");
  }
  return {
    isPinCreated: context.isPinCreatedQuery.data,
    isLoading: context.isPinCreatedQuery.isLoading,
    encryptedPin: context.getPinQuery.data,
    validPin: context.pinValidation.validPin,
    setPin: context.pinMutation.mutateAsync,
    validatePin: context.pinValidation.pinValidation.mutateAsync,
  };
};

export { VERIFICATION_STRING };
