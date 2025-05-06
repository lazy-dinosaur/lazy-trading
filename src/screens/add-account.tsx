import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
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
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAccounts } from "@/contexts/accounts/use";
import { useCache } from "@/contexts/cache/use";
import { ExchangeType } from "@/lib/accounts";
import { useNavigate, useSearchParams } from "react-router";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { Loader2, Info, AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
import { useAnalytics } from "@/contexts/analytics/use";
import { useTranslation } from "react-i18next";

// 폼 유효성 검사 스키마 (t 파라미터를 사용하지 않는 방식으로 수정)
const formSchema = z.object({
  exchange: z.enum(["bybit", "binance", "bitget"] as const),
  name: z.string().min(1),
  apiKey: z.string().min(1),
  secretKey: z.string().min(1),
});

type FormValue = z.infer<typeof formSchema>;

// 거래소별 가이드 데이터 함수
const getExchangeGuides = (t: any) => ({
  bybit: {
    title: t("account.bybit_api_guide"),
    url: "https://www.bybit.com/app/user/api-management",
    steps: [
      t("account.bybit_step_1", "Bybit 계정에 로그인합니다."),
      t("account.bybit_step_2", "우측 상단의 프로필 아이콘을 클릭한 후 'API Management'를 선택합니다."),
      t("account.bybit_step_3", "'Create New Key'를 클릭합니다."),
      t("account.bybit_step_4", "키 이름을 입력하고 읽기 및 거래 권한을 선택합니다."),
      t("account.bybit_step_5", "보안 인증을 완료하고 키를 생성합니다."),
      t("account.bybit_step_6", "API 키와 Secret 키를 저장하고 이 앱에 입력합니다.")
    ]
  },
  binance: {
    title: t("account.binance_api_guide"),
    url: "https://www.binance.com/en/my/settings/api-management",
    steps: [
      t("account.binance_step_1", "Binance 계정에 로그인합니다."),
      t("account.binance_step_2", "'API Management'로 이동합니다."),
      t("account.binance_step_3", "'Create API'를 클릭합니다."),
      t("account.binance_step_4", "보안 인증을 완료하고 API 이름을 입력합니다."),
      t("account.binance_step_5", "필요한 권한을 선택하고 API 키를 생성합니다."),
      t("account.binance_step_6", "API 키와 Secret 키를 저장하고 이 앱에 입력합니다.")
    ]
  },
  bitget: {
    title: t("account.bitget_api_guide"),
    url: "https://www.bitget.com/en/account/apiManagement",
    steps: [
      t("account.bitget_step_1", "Bitget 계정에 로그인합니다."),
      t("account.bitget_step_2", "'My Account' > 'API Management'로 이동합니다."),
      t("account.bitget_step_3", "'Create API'를 클릭합니다."),
      t("account.bitget_step_4", "API 이름과 권한을 설정합니다."),
      t("account.bitget_step_5", "보안 인증을 완료하고 키를 생성합니다."),
      t("account.bitget_step_6", "API 키와 Secret 키를 저장하고 이 앱에 입력합니다.")
    ]
  }
});

const AddAccount = () => {
  const { t } = useTranslation();

  const form = useForm<FormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      exchange: "bybit",
      name: "",
      apiKey: "",
      secretKey: "",
    }
  });

  const navigate = useNavigate();
  const { cache, updateCache } = useCache();
  const { trackEvent } = useAnalytics();

  const [searchParams, setSearchParams] = useSearchParams();
  const exchangeParam = searchParams.get("exchange") as ExchangeType;

  const { addNewAccount, refreshAccounts, validateAccount } = useAccounts();

  const [validChecking, setValidCheck] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentExchange = cache?.data?.exchange as ExchangeType;

  // 현재 선택된 거래소
  const selectedExchange = form.watch("exchange") as ExchangeType || "bybit";

  // 가이드 데이터 초기화
  const exchangeGuides = getExchangeGuides(t);

  const onSubmit = async (data: FormValue) => {
    setValidCheck(true);
    setError(null);

    // 검증 시작 토스트
    const loadingToast = toast.loading(t("account.validating_api_key"));

    try {
      const validCheck = await validateAccount({
        exchange: data.exchange,
        apikey: data.apiKey,
        secret: data.secretKey,
      });

      if (validCheck) {
        toast.dismiss(loadingToast);
        toast.loading(t("account.adding_account"));

        // 거래소별 기본 포지션 모드 설정
        // 비트겟과 바이낸스는 현재 원웨이 모드만 지원
        let positionMode: "oneway" | "hedge" | undefined;
        if (data.exchange === "bitget" || data.exchange === "binance") {
          positionMode = "oneway"; // 비트겟과 바이낸스는 항상 원웨이 모드
        } else {
          positionMode = undefined; // 다른 거래소는 기본값 적용
        }

        const res = await addNewAccount({
          exchange: data.exchange as ExchangeType,
          name: data.name,
          apiKey: data.apiKey,
          secretKey: data.secretKey,
          positionMode, // 비트겟의 경우 oneway로 설정, 다른 경우 undefined
        });

        if (res && res.success) {
          // 애널리틱스 이벤트 트래킹 - 계정 추가 성공
          trackEvent({
            action: 'account_added',
            category: 'account_management',
            label: data.exchange,
            name: data.name
          });

          // 성공 토스트
          toast.dismiss();
          // 계정 이름이 제대로 표시되도록 변수를 명시적으로 전달
          const accountName = data.name;
          toast.success(t("account.account_added_success", { name: accountName }));

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
        } else {
          throw new Error(t("account.adding_account_error"));
        }
      } else {
        // 애널리틱스 이벤트 트래킹 - 계정 검증 실패
        trackEvent({
          action: 'account_validation',
          category: 'account_management',
          label: 'failed',
          exchange: data.exchange
        });

        toast.dismiss(loadingToast);
        toast.error(t("account.api_validation_failed"));
        setError(t("account.check_api_key_valid"));
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(t("account.adding_account_error"));
      setError(t("account.check_input_info"));
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
    const subscription = form.watch((value) => {
      if (cache && !isLoading && value) {
        // debounce를 통해 상태 업데이트 최적화
        const timeoutId = setTimeout(() => {
          updateCache({ ...cache, data: value as any });
        }, 300);
        return () => clearTimeout(timeoutId);
      }
    });
    return () => subscription.unsubscribe();
  }, [cache, isLoading, form, updateCache]);

  // 거래소 선택시 토스트 안내
  useEffect(() => {
    if (!isLoading && selectedExchange) {
      toast.dismiss();
      // 변수를 먼저 대문자로 변환하여 거래소 이름이 제대로 표시되도록 함
      const exchangeName = String(selectedExchange).toUpperCase();
      toast.success(t("account.exchange_selected", { exchange: exchangeName }), {
        duration: 1500,
        icon: '🔄',
      });
    }
  }, [selectedExchange, isLoading, t]);

  return (
    <ScreenWrapper headerProps={{ title: t("account.add_account") }}>
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="form" className="flex-1">{t("account.account_info")}</TabsTrigger>
          <TabsTrigger value="guide" className="flex-1">{t("account.api_setting_guide")}</TabsTrigger>
        </TabsList>

        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">{t("account.api_key_setting")}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("account.api_key_encrypted")}
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("common.error")}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Form {...form} >
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="exchange"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="exchange">{t("account.exchange")}</Label>
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
                          <FormControl>
                            <SelectTrigger id="exchange">
                              <SelectValue placeholder={t("account.select_exchange")} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent position="popper">
                            <SelectItem value="bybit">Bybit</SelectItem>
                            <SelectItem value="binance">Binance</SelectItem>
                            <SelectItem value="bitget">Bitget</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="name">{t("account.account_name")}</Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="name"
                            placeholder={t("account.enter_account_name")}
                            onBlur={() => {
                              if (field.value) {
                                toast(`'${field.value}' ${t("account.name_set_message", "이름으로 계정이 설정됩니다")}`, {
                                  icon: '📝',
                                  duration: 1500,
                                });
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          {t("account.account_to_distinguish")}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="apiKey" className="flex items-center gap-1">
                          {t("account.api_key")}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("account.api_key_tooltip")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="apiKey"
                            placeholder={t("account.api_key_tooltip")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="secretKey" className="flex items-center gap-1">
                          {t("account.api_secret")}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                {t("account.secret_key_tooltip")}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="secretKey"
                            type="password"
                            placeholder={t("account.api_secret")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-center pt-4 w-full gap-4">
                    <Button
                      className="w-full md:w-40"
                      disabled={validChecking}
                      variant="outline"
                      onClick={() => {
                        toast.success(t("account.operation_cancelled"), {
                          icon: '✖️',
                          duration: 1500
                        });
                        navigate(-1);
                      }}
                      type="button"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      className="w-full md:w-40"
                      disabled={validChecking}
                      type="submit"
                    >
                      {validChecking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("account.verifying")}
                        </>
                      ) : t("common.save")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{exchangeGuides[selectedExchange].title}</h2>
                <a
                  href={exchangeGuides[selectedExchange].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 flex items-center mt-1 hover:underline"
                  onClick={() => {
                    toast.success(t("account.go_to_exchange_api"), {
                      icon: '🔗',
                      duration: 2000
                    });
                  }}
                >
                  {t("account.go_to_exchange_api")}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>

              <Accordion type="single" collapsible defaultValue="steps">
                <AccordionItem value="steps">
                  <AccordionTrigger>{t("account.api_key_setup_method")}</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal pl-5 space-y-2">
                      {exchangeGuides[selectedExchange].steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="permissions">
                  <AccordionTrigger>{t("account.required_api_permissions")}</AccordionTrigger>
                  <AccordionContent>
                    <p>{t("account.api_permissions_needed", "이 앱은 다음과 같은 API 권한이 필요합니다:")}</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>{t("account.account_info_permission")}</li>
                      <li>{t("account.balance_permission")}</li>
                      <li>{t("account.trading_permission")}</li>
                    </ul>
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        {t("account.security_withdrawal_warning")}
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="security">
                  <AccordionTrigger>{t("account.security_tips")}</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>{t("account.security_tip_1", "API 키는 다른 사람과 공유하지 마세요.")}</li>
                      <li>{t("account.security_tip_2", "필요한 권한만 부여하세요.")}</li>
                      <li>{t("account.security_tip_3", "IP 제한을 설정하여 보안을 강화하세요.")}</li>
                      <li>{t("account.security_tip_4", "주기적으로 API 키를 변경하는 것이 좋습니다.")}</li>
                      <li>{t("account.security_tip_5", "의심스러운 활동이 발견되면 즉시 API 키를 비활성화하세요.")}</li>
                      {selectedExchange === "binance" && (
                        <li className="text-yellow-600 dark:text-yellow-400 font-medium">
                          {t("account.binance_ip_warning")}
                        </li>
                      )}
                    </ul>
                    
                    {selectedExchange === "binance" && (
                      <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                        <p className="text-yellow-800 dark:text-yellow-200 text-sm flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          {t("account.binance_ip_restriction_explanation")}
                        </p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ScreenWrapper>
  );
};

export default AddAccount;
