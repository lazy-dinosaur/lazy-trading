import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { usePin } from "@/contexts/pin/use";

const formSchema = z.object({
  pin: z.string().length(4, {
    message: "PIN must be 4 digits",
  }),
});

type PinFormValues = z.infer<typeof formSchema>;

const MAX_ATTEMPTS = 5;

const Locked = () => {
  const { encryptedPin, validatePin, isLoading } = usePin();

  const [attempts, setAttempts] = useState(0);
  const queryClient = useQueryClient();

  const form = useForm<PinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
    },
  });

  const resetAllData = async () => {
    // 로컬 스토리지 초기화
    await chrome.storage.local.clear();
    // React Query 캐시 초기화
    queryClient.resetQueries();
    // 페이지 새로고침
    window.location.reload();
  };

  const onSubmit = async (values: PinFormValues) => {
    if (!encryptedPin) return;

    try {
      const result = await validatePin({
        encryptedPin,
        pin: values.pin,
      });

      if (!result) {
        setAttempts((prev) => {
          const newAttempts = prev + 1;
          if (newAttempts >= MAX_ATTEMPTS) {
            resetAllData();
          }
          return newAttempts;
        });
        form.reset();
      }
    } catch (error) {
      setAttempts((prev) => {
        const newAttempts = prev + 1;
        console.log(error);
        if (newAttempts >= MAX_ATTEMPTS) {
          resetAllData();
        }
        return newAttempts;
      });
      form.reset();
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-start p-8 space-y-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold text-center">Enter PIN</h1>
        <p className="text-sm text-muted-foreground text-center">
          Please enter your PIN to continue ({MAX_ATTEMPTS - attempts} attempts
          remaining)
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
                <FormMessage className="text-center" />
              </FormItem>
            )}
          />

          <div className="space-y-3 pt-6">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Unlock"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default Locked;
