import { usePin } from "@/hooks/usePin";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { z } from "zod";
import { Button } from "../ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "../ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";

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
const Pin = () => {
  const [firstPin, setFirstPin] = useState<string>("");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [attempts, setAttempts] = useState<number>(0);
  const { setPin, setPinCreated } = usePin();

  const form = useForm<PinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
    },
  });

  const onSubmit = (data: PinFormValues) => {
    if (step === "create") {
      // 첫 번째 PIN 입력
      setFirstPin(data.pin);
      setStep("confirm");
      form.reset();
    } else {
      // PIN 확인 단계
      if (data.pin === firstPin) {
        console.log("PIN confirmed:", data.pin);
        setPin(data.pin);
        setPinCreated(true);
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
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>
          {step === "create"
            ? "Create Your Pin Number"
            : "Confirm Your Pin Number"}
        </CardTitle>
        <CardDescription>
          {step === "create"
            ? "Pin number will not save in any storage, please dont forget the number"
            : `Please enter your PIN again to confirm (${5 - attempts} attempts remaining)`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex justify-between"
          >
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {step === "create" ? "Enter PIN" : "Confirm PIN"}
                  </FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={4}
                      value={field.value}
                      onChange={(value) => {
                        const numericValue = value.replace(/\D/g, "");
                        field.onChange(numericValue);
                      }}
                      className="space-x-10"
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
                  <FormDescription>
                    {step === "create" &&
                      "If you forget PIN, App will reset all data includes exchanges api keys"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2 mt-6">
              <Button type="submit">Submit</Button>
            </div>
          </form>

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
              className="mt-5"
            >
              Reset
            </Button>
          )}
        </Form>
      </CardContent>
    </Card>
  );
};
export default Pin;
