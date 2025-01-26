import {
  usePinCreated,
  usePinMutation,
  useGetPin,
  usePinValid,
} from "@/lib/pin";
import { createContext } from "react";

export interface PinContextType {
  isPinCreatedQuery: ReturnType<typeof usePinCreated>;
  pinMutation: ReturnType<typeof usePinMutation>;
  getPinQuery: ReturnType<typeof useGetPin>;
  pinValidation: ReturnType<typeof usePinValid>;
}

export const VERIFICATION_STRING = "PIN_VERIFICATION_TOKEN";

export const PinContext = createContext<PinContextType | undefined>(undefined);
