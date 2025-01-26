import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { usePin } from "@/hooks/use-pin-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";

const formSchema = z.object({
  pin: z
    .string()
    .min(4, "PIN must be 4 digits")
    .max(4, "PIN must be 4 digits")
    .regex(/^[0-9]+$/, "Only numbers are allowed"),
});
interface PinFormValues {
  pin: string;
}

const SetPin = () => {
  const [firstPin, setFirstPin] = useState<string>("");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [attempts, setAttempts] = useState<number>(0);
  const { setPin } = usePin();
  const navigation = useNavigate();

  const form = useForm<PinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
    },
  });

  const onSubmit = async (data: PinFormValues) => {
    if (step === "create") {
      // 첫 번째 PIN 입력
      setFirstPin(data.pin);
      setStep("confirm");
      form.reset();
    } else {
      // PIN 확인 단계
      if (data.pin === firstPin) {
        console.log("PIN confirmed:", data.pin);
        const res = await setPin(data.pin);
        if (res) {
          navigation("/dashboard", { replace: true });
        }
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          // 5번 실패시 처음으로 돌아가기
          setStep("create");
          setFirstPin("");
          setAttempts(0);
          form.reset();
          form.setError("pin", {
            type: "manual",
            message: "Too many failed attempts. Please set your PIN again.",
          });
        } else {
          form.reset();
          form.setError("pin", {
            type: "manual",
            message: `PINs don't match. ${5 - newAttempts} attempts remaining.`,
          });
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-start p-8 space-y-6">
      {/* <div className="w-full block"></div> */}
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-center">
          {step === "create" ? "Create PIN" : "Confirm PIN"}
        </h1>
        <p className="text-sm text-muted-foreground text-center">
          {step === "create"
            ? "Set a 4-digit PIN to secure your account"
            : `Confirm your PIN (${5 - attempts} attempts remaining)`}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-md space-y-6"
        >
          <FormField
            control={form.control}
            name="pin"
            render={({ field }) => (
              <FormItem className="space-y-4 flex flex-col items-center w-full">
                <FormControl className="w-full flex justify-center">
                  <InputOTP
                    maxLength={4}
                    value={field.value}
                    onChange={(value) => {
                      const numericValue = value.replace(/\D/g, "");
                      field.onChange(numericValue);
                    }}
                    className="flex justify-center gap-4 w-full"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={1} />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                {step === "create" && (
                  <FormDescription className="text-center text-xs">
                    Forgetting PIN will reset all data including API keys
                  </FormDescription>
                )}
                <FormMessage className="text-center" />
              </FormItem>
            )}
          />

          <div className="space-y-3 pt-4">
            <Button type="submit" className="w-full">
              {step === "create" ? "Continue" : "Confirm PIN"}
            </Button>

            {step === "confirm" && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("create");
                  setFirstPin("");
                  setAttempts(0);
                  form.reset();
                }}
                className="w-full"
              >
                Start Over
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Progress indicator */}
      <div className="flex items-center gap-2 mt-4">
        <div
          className={`h-1 w-4 rounded-full ${step === "create" ? "bg-primary" : "bg-muted"}`}
        />
        <div
          className={`h-1 w-4 rounded-full ${step === "confirm" ? "bg-primary" : "bg-muted"}`}
        />
      </div>
    </div>
  );
};
export default SetPin;
