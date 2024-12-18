import { usePin } from "@/hooks/usePin";
import { useEffect } from "react";
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
import PopupContainer from "./PopupContainer";

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
  const form = useForm<PinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
    },
  });
  const onSubmit = (data: PinFormValues) => {
    setPin(data.pin);
  };
  const { pin, setPin, isLoading } = usePin();
  useEffect(() => {}, [isLoading, pin, setPin]);
  return (
    <PopupContainer>
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Enter your pin number</CardTitle>
          <CardDescription>
            Its not validate your pin number this app will use the pin number to
            unhash the hashed api keys
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
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </PopupContainer>
  );
};
export default Locked;
