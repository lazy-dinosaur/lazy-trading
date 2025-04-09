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

// 폼 유효성 검사 스키마
const formSchema = z.object({
  exchange: z.enum(["bybit", "binance", "bitget"] as const),
  name: z.string().min(1, "계정 이름은 필수입니다."),
  apiKey: z.string().min(1, "API 키는 필수입니다."),
  secretKey: z.string().min(1, "Secret 키는 필수입니다."),
});

type FormValue = z.infer<typeof formSchema>;

// 거래소별 가이드 데이터
const exchangeGuides = {
  bybit: {
    title: "Bybit API 키 설정 가이드",
    url: "https://www.bybit.com/app/user/api-management",
    steps: [
      "Bybit 계정에 로그인합니다.",
      "우측 상단의 프로필 아이콘을 클릭한 후 'API Management'를 선택합니다.",
      "'Create New Key'를 클릭합니다.",
      "키 이름을 입력하고 읽기 및 거래 권한을 선택합니다.",
      "보안 인증을 완료하고 키를 생성합니다.",
      "API 키와 Secret 키를 저장하고 이 앱에 입력합니다."
    ]
  },
  binance: {
    title: "Binance API 키 설정 가이드",
    url: "https://www.binance.com/en/my/settings/api-management",
    steps: [
      "Binance 계정에 로그인합니다.",
      "'API Management'로 이동합니다.",
      "'Create API'를 클릭합니다.", 
      "보안 인증을 완료하고 API 이름을 입력합니다.",
      "필요한 권한을 선택하고 API 키를 생성합니다.",
      "API 키와 Secret 키를 저장하고 이 앱에 입력합니다."
    ]
  },
  bitget: {
    title: "Bitget API 키 설정 가이드",
    url: "https://www.bitget.com/en/account/apiManagement",
    steps: [
      "Bitget 계정에 로그인합니다.",
      "'My Account' > 'API Management'로 이동합니다.",
      "'Create API'를 클릭합니다.",
      "API 이름과 권한을 설정합니다.",
      "보안 인증을 완료하고 키를 생성합니다.",
      "API 키와 Secret 키를 저장하고 이 앱에 입력합니다."
    ]
  }
};

const AddAccount = () => {
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
  const selectedExchange = form.watch("exchange") || "bybit";

  const onSubmit = async (data: FormValue) => {
    setValidCheck(true);
    setError(null);
    
    // 검증 시작 토스트
    const loadingToast = toast.loading("API 키 유효성 검증 중...");

    try {
      const validCheck = await validateAccount({
        exchange: data.exchange,
        apikey: data.apiKey,
        secret: data.secretKey,
      });
      
      if (validCheck) {
        toast.dismiss(loadingToast);
        toast.loading("계정 추가 중...");
        
        const res = await addNewAccount({
          exchange: data.exchange as ExchangeType,
          name: data.name,
          apiKey: data.apiKey,
          secretKey: data.secretKey,
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
          toast.success(`${data.name} 계정이 성공적으로 추가되었습니다!`);
          
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
          throw new Error("계정 추가에 실패했습니다.");
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
        toast.error("API 키 검증에 실패했습니다.");
        setError("API 키 검증에 실패했습니다. 키가 올바른지 확인해주세요.");
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("계정 추가 중 오류가 발생했습니다.");
      setError("계정 추가 중 오류가 발생했습니다. 입력 정보를 확인해주세요.");
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

  // 거래소 선택시 토스트 안내
  useEffect(() => {
    if (!isLoading && selectedExchange) {
      toast.dismiss();
      toast.success(`${selectedExchange.toUpperCase()} 거래소가 선택되었습니다.`, {
        duration: 1500,
        icon: '🔄',
      });
    }
  }, [selectedExchange, isLoading]);

  return (
    <ScreenWrapper headerProps={{ title: "계정 추가" }}>
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="form" className="flex-1">계정 정보</TabsTrigger>
          <TabsTrigger value="guide" className="flex-1">API 설정 가이드</TabsTrigger>
        </TabsList>
        
        <TabsContent value="form" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold">API 키 설정</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  API 키는 PIN 번호로 암호화됩니다
                </p>
              </div>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>오류</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="exchange"
                    render={({ field }) => (
                      <FormItem>
                        <Label htmlFor="exchange">거래소</Label>
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
                              <SelectValue placeholder="거래소 선택" />
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
                        <Label htmlFor="name">계정 이름</Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="name"
                            placeholder="계정을 구분할 이름 입력"
                            onBlur={() => {
                              if (field.value) {
                                toast(`'${field.value}' 이름으로 계정이 설정됩니다`, {
                                  icon: '📝',
                                  duration: 1500,
                                });
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          여러 계정을 구분할 수 있는 이름을 설정하세요
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
                          API 키
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                거래소에서 발급받은 API 키를 입력하세요
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="apiKey"
                            placeholder="거래소에서 발급받은 API 키"
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
                          Secret 키
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                API 키와 함께 발급받은 Secret 키를 입력하세요
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                        <FormControl>
                          <Input
                            {...field}
                            id="secretKey"
                            type="password"
                            placeholder="Secret 키 입력"
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
                        toast.success("작업이 취소되었습니다", { 
                          icon: '✖️',
                          duration: 1500
                        });
                        navigate(-1);
                      }}
                      type="button"
                    >
                      취소
                    </Button>
                    <Button 
                      className="w-full md:w-40" 
                      disabled={validChecking} 
                      type="submit"
                    >
                      {validChecking ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          확인 중...
                        </>
                      ) : "저장"}
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
                    toast.success("거래소 API 관리 페이지로 이동합니다", {
                      icon: '🔗',
                      duration: 2000
                    });
                  }}
                >
                  거래소 API 관리 페이지로 이동
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
              
              <Accordion type="single" collapsible defaultValue="steps">
                <AccordionItem value="steps">
                  <AccordionTrigger>API 키 설정 방법</AccordionTrigger>
                  <AccordionContent>
                    <ol className="list-decimal pl-5 space-y-2">
                      {exchangeGuides[selectedExchange].steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="permissions">
                  <AccordionTrigger>필요한 API 권한</AccordionTrigger>
                  <AccordionContent>
                    <p>이 앱은 다음과 같은 API 권한이 필요합니다:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      <li>계정 정보 조회</li>
                      <li>잔고 조회</li>
                      <li>거래 (주문 생성 및 취소)</li>
                    </ul>
                    <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                      <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                        보안을 위해 출금 권한은 꼭 필요한 경우에만 활성화하세요.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="security">
                  <AccordionTrigger>보안 팁</AccordionTrigger>
                  <AccordionContent>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>API 키는 다른 사람과 공유하지 마세요.</li>
                      <li>필요한 권한만 부여하세요.</li>
                      <li>IP 제한을 설정하여 보안을 강화하세요.</li>
                      <li>주기적으로 API 키를 변경하는 것이 좋습니다.</li>
                      <li>의심스러운 활동이 발견되면 즉시 API 키를 비활성화하세요.</li>
                    </ul>
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
