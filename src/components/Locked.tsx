import { useState } from "react";
import { Loader2 } from "lucide-react";
import { usePin, validatePinWithAccounts } from "@/hooks/usePin";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAccounts } from "@/hooks/useAccounts";

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

const Locked = () => {
  const { accounts, deleteAllAccounts } = useAccounts();
  const [attempts, setAttempts] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const { setPinCreated, setPin } = usePin();
  const MAX_ATTEMPTS = 5;
  const form = useForm<PinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
    },
  });
  const onSubmit = async (data: PinFormValues) => {
    try {
      setIsValidating(true);
      const { pin } = data;

      if (accounts) {
        const isValid = await validatePinWithAccounts(pin, accounts);

        if (isValid) {
          setAttempts(0); // 성공시 시도 횟수 초기화
          setPin(pin);
          setStatusMessage({
            type: "success",
            message: "PIN verified successfully",
          });
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);

          if (newAttempts >= MAX_ATTEMPTS) {
            // 5번 실패시 모든 데이터 초기화
            deleteAllAccounts();
            setPinCreated(false);
            setStatusMessage({
              type: "error",
              message: "Too many failed attempts. All data has been reset.",
            });
          } else {
            setStatusMessage({
              type: "error",
              message: `Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`,
            });
          }
          form.reset();
        }
      }
    } catch (error) {
      console.error("PIN validation failed:", error);
      setStatusMessage({
        type: "error",
        message: "An error occurred while validating PIN",
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Enter your pin number</CardTitle>
        <CardDescription>
          Its not validate your pin number this app will use the pin number to
          unhash the hashed api keys
        </CardDescription>
      </CardHeader>
      <CardContent>
        {statusMessage.type && (
          <div
            className={`mb-4 p-3 rounded-md ${
              statusMessage.type === "success"
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            {statusMessage.message}
          </div>
        )}
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
                  <FormLabel>Enter PIN</FormLabel>
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
                    If you forget PIN, App will reset all data includes
                    exchanges api keys
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-2 mt-6">
              <Button type="submit" disabled={isValidating}>
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
export default Locked;
