import { Button } from "@/components/ui/button";

import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAccounts } from "@/contexts/accounts/use";
import { useCache } from "@/contexts/cache/use";
import { ExchangeType } from "@/lib/accounts";
import { useNavigate, useSearchParams } from "react-router";
import { ScreenWrapper } from "@/components/screen-wrapper";

type FormValue = {
  exchange: ExchangeType;
  name: string;
  apiKey: string;
  secretKey: string;
};

const AddAccount = () => {
  const form = useForm<FormValue>();
  const navigate = useNavigate();
  const { cache, updateCache } = useCache();

  const [searchParams, setSearchParams] = useSearchParams();
  const exchangeParam = searchParams.get("exchange") as ExchangeType;

  const { addNewAccount, refreshAccounts, validateAccount } = useAccounts();

  const [validChecking, setValidCheck] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const currentExchange = cache?.data?.exchange as ExchangeType;

  const onSubmit = async (data: FormValue) => {
    setValidCheck(true);

    try {
      const validCheck = await validateAccount({
        exchange: data.exchange,
        apikey: data.apiKey,
        secret: data.secretKey,
      });
      console.log("valid:", validCheck);

      if (validCheck) {
        const res = await addNewAccount({
          exchange: data.exchange as ExchangeType,
          name: data.name,
          apiKey: data.apiKey,
          secretKey: data.secretKey,
        });
        if (res && res.success) {
          // 계정 추가 후 강제로 새로고침 실행
          await refreshAccounts();
          
          // 이전 화면이 trade 화면이었다면, 새 계정 ID로 거기로 리다이렉트
          const returnTo = sessionStorage.getItem('returnToTradeScreen');
          if (returnTo) {
            sessionStorage.removeItem('returnToTradeScreen');
            const params = new URLSearchParams(returnTo);
            // 새로 생성된 계정 ID 사용
            if (res.id) {
              params.set("id", res.id);
            }
            navigate(`/trade?${params.toString()}`);
          } else {
            // 아니면 기본 화면으로 이동
            navigate("/search");
          }
        }
      }
    } catch (err) {
      //TODO: 에러 알림 표시 구현해야함
      console.log(err);
      form.setValue("apiKey", "");
      form.setValue("secretKey", "");
    } finally {
      setValidCheck(false);
    }
  };

  useEffect(() => {
    if (isLoading && cache?.data) {
      // cache의 데이터로 form 초기화
      form.setValue("exchange", cache.data.exchange as ExchangeType);
      form.setValue("name", cache.data.name || "");
      form.setValue("apiKey", cache.data.apiKey || "");
      form.setValue("secretKey", cache.data.secretKey || "");

      // URL에 exchange 파라미터가 있으면 form과 cache 모두 업데이트
      if (exchangeParam && exchangeParam !== cache.data.exchange) {
        form.setValue("exchange", exchangeParam);
        updateCache({
          ...cache,
          data: { ...cache.data, exchange: exchangeParam },
        });
      }
      // URL에 exchange 파라미터가 없으면 현재 cache 값으로 URL 업데이트
      else if (cache.data.exchange) {
        setSearchParams({ exchange: cache.data.exchange });
      }

      setLoading(false);
    }
  }, [isLoading, form, cache, exchangeParam, setSearchParams, updateCache]);

  useEffect(() => {
    const subscription = form.watch((data) => {
      if (cache && !isLoading) {
        // debounce를 통해 상태 업데이트 최적화
        const timeoutId = setTimeout(() => {
          updateCache({ ...cache, data });
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [cache, isLoading, form, updateCache]);

  return (
    <ScreenWrapper headerProps={{ title: "Add Account" }}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="mb-3 space-y-2">
            <h2 className="text-xl font-semibold">Setup Your API Key</h2>
            <p className="text-sm text-muted-foreground">
              API Key will encrypt with your PIN number
            </p>
          </div>
          <div className="grid w-full items-center gap-4">
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
                        setSearchParams((prev) => {
                          const newParam = new URLSearchParams(prev);
                          newParam.set("exchange", value);
                          return newParam;
                        });
                      }}
                      defaultValue={exchangeParam || currentExchange}
                    >
                      <SelectTrigger id="exchange">
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
                      {...field}
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
                      {...field}
                      id="apiKey"
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
                      {...field}
                      id="secret"
                      placeholder="Secret of your Api"
                    />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className="flex justify-center pt-6 w-full gap-4">
            <Button
              className="w-52"
              disabled={validChecking}
              variant="outline"
              onClick={() => navigate(-1)}
              type="button"
            >
              {validChecking ? "..." : "Close"}
            </Button>
            <Button className="w-52" disabled={validChecking} type="submit">
              {validChecking ? "..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>
    </ScreenWrapper>
  );
};

export default AddAccount;
