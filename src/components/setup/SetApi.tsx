import { Label } from "@radix-ui/react-label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../ui/select.tsx";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Form, FormField, FormItem } from "../ui/form.tsx";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useAppStateCache } from "@/hooks/useAppStateCache.ts";
import { ExchangeType, useAccounts } from "@/hooks/useAccounts.ts";
import { useNavigate } from "react-router";
import useExchange from "@/hooks/useExchange.ts";

type FormValue = {
  exchange: ExchangeType;
  name: string;
  apiKey: string;
  secretKey: string;
};

const SetApi = () => {
  const form = useForm<FormValue>();
  const { updateState, appState } = useAppStateCache();
  const [isLoading, setLoading] = useState(true);
  const { addAccount, isAccountAdded } = useAccounts();
  const navigate = useNavigate();
  const [validChecking, setValidCheck] = useState(false);
  const { fetchBalance } = useExchange();

  useEffect(() => {
    if (isAccountAdded) navigate("/search");
  }, [isAccountAdded, navigate]);

  const onSubmit = async (data: FormValue) => {
    setValidCheck(true);

    try {
      const validCheck = await fetchBalance.mutateAsync({
        exchange: data.exchange,
        apikey: data.apiKey,
        secret: data.secretKey,
      });

      if (validCheck) {
        addAccount({
          exchange: data.exchange as ExchangeType,
          name: data.name,
          apiKey: data.apiKey,
          secretKey: data.secretKey,
        });
      }
    } catch (err) {
      fetchBalance.reset();
      //TODO: 에러 알림 표시 구현해야함
      console.log(err);
      form.setValue("apiKey", "");
      form.setValue("secretKey", "");
    } finally {
      setValidCheck(false);
    }
  };

  useEffect(() => {
    console.log(appState, "appState");
    if (isLoading && appState) {
      form.setValue("exchange", appState.data.exchange);
      form.setValue("name", appState.data.name);
      form.setValue("apiKey", appState.data.apiKey);
      form.setValue("secretKey", appState.data.secretKey);
      setLoading(false);
    }
  }, [isLoading, form]);

  form.watch((data) => {
    if (appState && !isLoading) {
      updateState({ ...appState, data });
    }
  });

  return (
    <Card className="w-[400px]">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Setup Your API Key</CardTitle>
            <CardDescription>
              API Key will encrypt with your PIN number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-2">
              <div className="flex flex-col space-y-1.5">
                <FormField
                  control={form.control}
                  name="exchange"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="exchange">Exchanges</Label>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                        }}
                      >
                        <SelectTrigger id="framework">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="bybit">Bybit</SelectItem>
                          <SelectItem value="binance">Binance</SelectItem>
                          <SelectItem value="bitget">Bitget</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                        id="name"
                        placeholder="Name for remember"
                      />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="apiKey">Api Key</Label>
                      <Input
                        id="apiKey"
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                        placeholder="Code of your Api"
                      />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <FormField
                  control={form.control}
                  name="secretKey"
                  render={({ field }) => (
                    <FormItem>
                      <Label htmlFor="secretKey">Secret</Label>
                      <Input
                        id="secret"
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                        }}
                        placeholder="Secret of your Api"
                      />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button disabled={validChecking} variant="outline">
              {validChecking ? "...." : "Cancel"}
            </Button>
            <Button disabled={validChecking} type="submit">
              {validChecking ? "...." : "Save"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
export default SetApi;
