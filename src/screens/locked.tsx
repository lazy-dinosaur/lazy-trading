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
import { useState, useEffect } from "react";
import { usePin } from "@/contexts/pin/use";
import { Lock, Unlock, X, RefreshCw, Shield, ShieldAlert, Github } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";
import { useAnalytics } from "@/contexts/analytics/use";

const MAX_ATTEMPTS = 5;

// 폼 스키마는 컴포넌트 내부에서 정의됩니다

// 숫자 키패드 구성
const numpadKeys = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ["clear", 0, "delete"],
];

const Locked = () => {
  const { t } = useTranslation();
  const { encryptedPin, validatePin } = usePin();
  const [attempts, setAttempts] = useState(0);
  const [showPin, setShowPin] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [shake, setShake] = useState(false);
  const [validating, setValidating] = useState(false);
  const queryClient = useQueryClient();
  const { trackEvent } = useAnalytics();

  // 폼 스키마를 컴포넌트 내부로 이동하여 번역 함수(t) 사용
  const formSchema = z.object({
    pin: z.string().length(4, {
      message: t('auth.pin_must_be_4_digits', 'PIN은 4자리 숫자여야 합니다'),
    }),
  });
  
  // 타입 정의
  type PinFormValues = z.infer<typeof formSchema>;

  const form = useForm<PinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
    },
  });

  // 앱 초기화 경고 표시 (2회 이상 실패 시)
  useEffect(() => {
    if (attempts >= 2) {
      setShowWarning(true);
    }
  }, [attempts]);

  const resetAllData = async () => {
    const toastId = toast.loading(t('auth.resetting_app_data', '앱 데이터를 초기화 중입니다...'));
    try {
      // 애널리틱스 이벤트 트래킹
      trackEvent({
        action: 'reset_data',
        category: 'security',
        label: 'max_pin_attempts',
        value: MAX_ATTEMPTS
      });
      
      // 로컬 스토리지 초기화
      await chrome.storage.local.clear();
      // React Query 캐시 초기화
      queryClient.resetQueries();

      toast.dismiss(toastId);
      toast.success(t('auth.all_data_reset', '모든 데이터가 초기화되었습니다. 앱을 다시 시작합니다.'), {
        duration: 3000,
        icon: "🔄",
      });

      // 2초 후 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(t('auth.error_resetting_data', '데이터 초기화 중 오류가 발생했습니다.'));
      console.error("데이터 초기화 오류:", error);
    }
  };

  const onSubmit = async (values: PinFormValues) => {
    if (!encryptedPin) return;

    setValidating(true);
    const loadingToast = toast.loading(t('auth.verifying_pin', 'PIN 확인 중...'));

    try {
      const result = await validatePin({
        encryptedPin,
        pin: values.pin,
      });

      toast.dismiss(loadingToast);
      setValidating(false);

      if (!result) {
        // PIN 검증 실패
        setShake(true);
        setTimeout(() => setShake(false), 500);

        // 애널리틱스 이벤트 트래킹 - 잘못된 PIN
        trackEvent({
          action: 'pin_validation',
          category: 'security',
          label: 'failed',
          value: attempts + 1
        });

        setAttempts((prev) => {
          const newAttempts = prev + 1;

          if (newAttempts >= MAX_ATTEMPTS) {
            toast.error(
              t('auth.pin_attempts_exceeded', 'PIN 시도 횟수를 초과했습니다. 데이터를 초기화합니다.'),
              {
                duration: 4000,
                icon: "⚠️",
              },
            );
            resetAllData();
          } else {
            const remainingAttempts = MAX_ATTEMPTS - newAttempts;
            toast.error(
              t('auth.incorrect_pin_remaining_attempts', 'PIN이 올바르지 않습니다. 남은 시도 횟수: {{count}}회', {count: remainingAttempts}),
              {
                icon: "❌",
                duration: 3000,
              },
            );
          }

          return newAttempts;
        });

        form.reset();
      } else {
        // PIN 검증 성공
        toast.success(t('auth.pin_verification_success', 'PIN 확인 성공! 환영합니다.'), {
          icon: "🔓",
          duration: 2000,
        });
        
        // 애널리틱스 이벤트 트래킹 - 성공한 PIN
        trackEvent({
          action: 'pin_validation',
          category: 'security',
          label: 'success'
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      setValidating(false);
      toast.error(t('auth.pin_verification_error', 'PIN 확인 중 오류가 발생했습니다.'));

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

  // 숫자 키패드 처리
  const handleNumpadPress = (key: number | string) => {
    const currentPin = form.getValues("pin");

    if (key === "clear") {
      form.setValue("pin", "");
    } else if (key === "delete") {
      form.setValue("pin", currentPin.slice(0, -1));
    } else if (typeof key === "number" && currentPin.length < 4) {
      form.setValue("pin", currentPin + key);

      // 자동 제출 처리 (4자리 입력 완료 시)
      if (currentPin.length === 3) {
        // 약간의 지연 후 제출 (UI가 업데이트될 시간을 주기 위해)
        setTimeout(() => {
          form.handleSubmit(onSubmit)();
        }, 300);
      }
    }
  };

  // GitHub 링크 열기
  const openGithubLink = () => {
    window.open("https://github.com/lazy-dinosaur", "_blank");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* 앱 타이틀 */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary mb-2">LazyTrading</h1>
        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <span>by</span>
          <button 
            onClick={openGithubLink}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            lazy-dinosaur
            <Github className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{
                scale: 1,
                rotate: [0, -5, 5, -5, 5, 0],
                transition: {
                  duration: 0.5,
                  rotate: {
                    repeat: Infinity,
                    repeatType: "mirror",
                    repeatDelay: 5,
                  },
                },
              }}
              className="w-20 h-20 bg-primary/10 flex items-center justify-center rounded-full"
            >
              <Lock className="h-10 w-10 text-primary" />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key="unlock-title"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl font-bold">{t('auth.unlock')}</h1>
              <p className="text-muted-foreground mt-2">
                {t('auth.enter_pin_to_access')}
                {attempts > 0 && (
                  <span className="text-destructive font-medium">
                    {" "}
                    {t('auth.remaining_attempts', '(남은 시도: {{count}}회)', {count: MAX_ATTEMPTS - attempts})}
                  </span>
                )}
              </p>
            </motion.div>
          </AnimatePresence>

          {showWarning && (
            <Alert variant="destructive" className="mb-6">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>{t('auth.pin_entry_warning', 'PIN 입력 주의')}</AlertTitle>
              <AlertDescription className="text-xs">
                {t('auth.pin_reset_warning', 'PIN을 {{count}}회 이상 잘못 입력하면 모든 데이터가 초기화됩니다. PIN이 기억나지 않으면 앱을 재설치하고 API 키를 다시 설정해야 합니다.', {count: MAX_ATTEMPTS})}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem className="space-y-4">
                    <FormControl>
                      <motion.div
                        animate={shake ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                        transition={{ duration: 0.5 }}
                        className="w-full flex justify-center"
                      >
                        <InputOTP
                          maxLength={4}
                          value={field.value}
                          onChange={(value) => {
                            const numericValue = value.replace(/\D/g, "");
                            field.onChange(numericValue);
                          }}
                          className="flex justify-center gap-4"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          type={showPin ? "text" : "password"}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot
                              index={0}
                              className={`h-16 w-16 text-2xl border-2 ${field.value[0] ? "border-primary" : ""}`}
                            />
                          </InputOTPGroup>
                          <InputOTPGroup>
                            <InputOTPSlot
                              index={1}
                              className={`h-16 w-16 text-2xl border-2 ${field.value[1] ? "border-primary" : ""}`}
                            />
                          </InputOTPGroup>
                          <InputOTPGroup>
                            <InputOTPSlot
                              index={2}
                              className={`h-16 w-16 text-2xl border-2 ${field.value[2] ? "border-primary" : ""}`}
                            />
                          </InputOTPGroup>
                          <InputOTPGroup>
                            <InputOTPSlot
                              index={3}
                              className={`h-16 w-16 text-2xl border-2 ${field.value[3] ? "border-primary" : ""}`}
                            />
                          </InputOTPGroup>
                        </InputOTP>
                      </motion.div>
                    </FormControl>

                    <div className="flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPin(!showPin)}
                        className="text-xs"
                      >
                        {showPin ? (
                          <span className="flex items-center gap-1">
                            <Lock className="h-3 w-3" /> {t('auth.hide_pin', 'PIN 숨기기')}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> {t('auth.show_pin', 'PIN 표시하기')}
                          </span>
                        )}
                      </Button>
                    </div>

                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />

              {/* 숫자 키패드 */}
              <div className="mt-6 flex justify-center"> {/* 키패드 중앙 정렬 */}
                <div className="grid grid-cols-3 gap-3">
                  {numpadKeys.map((row, rowIndex) =>
                    row.map((key, colIndex) => (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          type="button"
                          variant={
                            key === "clear" || key === "delete"
                              ? "outline"
                              : "secondary"
                          }
                          size="lg"
                          className={`h-14 w-14 text-xl font-semibold ${
                            typeof key === "number"
                              ? "hover:bg-primary hover:text-primary-foreground"
                              : ""
                          }`}
                          onClick={() => handleNumpadPress(key)}
                          disabled={validating}
                        >
                          {key === "clear" ? (
                            <RefreshCw className="h-5 w-5" />
                          ) : key === "delete" ? (
                            <X className="h-5 w-5" />
                          ) : (
                            key
                          )}
                        </Button>
                      </motion.div>
                    )),
                  )}
                </div>
              </div>

              {/* 데이터 초기화 버튼 */}
              {attempts >= 3 && (
                <div className="pt-2 flex justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          t('auth.confirm_reset_data', '정말로 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
                        )
                      ) {
                        resetAllData();
                      }
                    }}
                    className="text-xs flex items-center gap-1"
                    disabled={validating}
                  >
                    <Shield className="h-3 w-3" />
                    {t('auth.reset_data', '데이터 초기화')}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        {t('auth.forgot_pin_message')}
      </p>
    </div>
  );
};

export default Locked;
