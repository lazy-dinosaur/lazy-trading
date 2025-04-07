import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { usePin } from "@/contexts/pin/use";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ShieldCheck,
  Lock,
  Unlock,
  X,
  Fingerprint,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const formSchema = z.object({
  pin: z
    .string()
    .min(4, "PIN은 4자리여야 합니다")
    .max(4, "PIN은 4자리여야 합니다")
    .regex(/^[0-9]+$/, "숫자만 입력 가능합니다"),
});

interface PinFormValues {
  pin: string;
}

// 숫자 키패드 구성
const numpadKeys = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ["clear", 0, "delete"],
];

// PIN 보안 강도 평가 함수
const getPinStrength = (pin: string): "weak" | "medium" | "strong" => {
  if (!pin || pin.length < 4) return "weak";

  // 연속된 숫자 체크 (1234, 4321, 1111 등)
  const isSequential =
    (parseInt(pin[0]) + 1 === parseInt(pin[1]) &&
      parseInt(pin[1]) + 1 === parseInt(pin[2]) &&
      parseInt(pin[2]) + 1 === parseInt(pin[3])) ||
    (parseInt(pin[0]) - 1 === parseInt(pin[1]) &&
      parseInt(pin[1]) - 1 === parseInt(pin[2]) &&
      parseInt(pin[2]) - 1 === parseInt(pin[3]));

  const isRepeated =
    pin[0] === pin[1] && pin[1] === pin[2] && pin[2] === pin[3];
  const hasPairs = pin[0] === pin[1] && pin[2] === pin[3];

  if (isSequential || isRepeated) return "weak";
  if (hasPairs) return "medium";
  return "strong";
};

// 보안 강도 색상
const strengthColors = {
  weak: "bg-red-500",
  medium: "bg-yellow-500",
  strong: "bg-green-500",
};

// 보안 강도 텍스트
const strengthText = {
  weak: "취약",
  medium: "보통",
  strong: "강력",
};

const SetPin = () => {
  const [firstPin, setFirstPin] = useState<string>("");
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [attempts, setAttempts] = useState<number>(0);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [shakeError, setShakeError] = useState<boolean>(false);
  const [pinStrength, setPinStrength] = useState<"weak" | "medium" | "strong">(
    "weak",
  );
  const { setPin } = usePin();
  const navigation = useNavigate();

  const form = useForm<PinFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      pin: "",
    },
  });

  // PIN 강도 업데이트
  useEffect(() => {
    if (step === "create") {
      const currentPin = form.watch("pin");
      if (currentPin.length === 4) {
        setPinStrength(getPinStrength(currentPin));
      } else {
        setPinStrength("weak");
      }
    }
  }, [form.watch("pin"), step]);

  const onSubmit = async (data: PinFormValues) => {
    if (step === "create") {
      // 첫 번째 PIN 입력
      setFirstPin(data.pin);
      setStep("confirm");
      form.reset();
      toast.success("PIN이 입력되었습니다. 확인을 위해 한번 더 입력해주세요.", {
        icon: "🔐",
        duration: 2000,
      });
    } else {
      // PIN 확인 단계
      if (data.pin === firstPin) {
        console.log("PIN confirmed:", data.pin);
        toast.loading("PIN을 설정 중입니다...");

        try {
          const res = await setPin(data.pin);
          if (res) {
            toast.dismiss();
            toast.success("PIN이 성공적으로 설정되었습니다!", {
              icon: "✅",
              duration: 2000,
            });
            navigation("/dashboard", { replace: true });
          }
        } catch (error) {
          toast.dismiss();
          toast.error("PIN 설정 중 오류가 발생했습니다");
          console.error("PIN 설정 오류:", error);
        }
      } else {
        setShakeError(true);
        setTimeout(() => setShakeError(false), 500);

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          // 5번 실패시 처음으로 돌아가기
          toast.error(
            "입력 시도 횟수 초과! PIN 설정을 처음부터 다시 시작합니다.",
          );
          setStep("create");
          setFirstPin("");
          setAttempts(0);
          form.reset();
          form.setError("pin", {
            type: "manual",
            message: "시도 횟수를 초과했습니다. PIN을 다시 설정해주세요.",
          });
        } else {
          form.reset();
          toast.error(
            `PIN이 일치하지 않습니다. 남은 시도 횟수: ${5 - newAttempts}회`,
          );
          form.setError("pin", {
            type: "manual",
            message: `PIN이 일치하지 않습니다. 남은 시도 횟수: ${5 - newAttempts}회`,
          });
        }
      }
    }
  };

  // 자동 제출 처리
  useEffect(() => {
    const pinValue = form.watch("pin");
    if (pinValue.length === 4) {
      form.handleSubmit(onSubmit)();
    }
  }, [form.watch("pin")]);

  // 숫자 키패드 처리
  const handleNumpadPress = (key: number | string) => {
    const currentPin = form.getValues("pin");

    if (key === "clear") {
      form.setValue("pin", "");
    } else if (key === "delete") {
      form.setValue("pin", currentPin.slice(0, -1));
    } else if (typeof key === "number" && currentPin.length < 4) {
      form.setValue("pin", currentPin + key);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardContent className="p-6">
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-20 h-20 bg-primary/10 flex items-center justify-center rounded-full"
            >
              <Fingerprint className="h-10 w-10 text-primary" />
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-center mb-6"
            >
              <h1 className="text-2xl font-bold">
                {step === "create" ? "PIN 코드 생성" : "PIN 코드 확인"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {step === "create"
                  ? "계정과 API 키를 보호하기 위한 4자리 PIN을 설정하세요"
                  : `PIN을 다시 한번 입력하여 확인해주세요 (남은 시도: ${5 - attempts}회)`}
              </p>
            </motion.div>
          </AnimatePresence>

          {step === "create" && (
            <Alert className="mb-6 border-primary/20 bg-primary/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <AlertTitle>보안 안내</AlertTitle>
              <AlertDescription className="text-xs">
                PIN은 API 키를 안전하게 암호화하는 데 사용됩니다. PIN을
                잊어버리면 모든 데이터가 초기화됩니다. 안전한 곳에 PIN을
                기록해두세요.
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
                        animate={
                          shakeError ? { x: [0, -10, 10, -10, 10, 0] } : {}
                        }
                        transition={{ duration: 0.5 }}
                        className="w-full flex justify-center" // 중앙 정렬 수정
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

                    {/* PIN 보안 강도 표시 (1단계에서만 표시) */}
                    {step === "create" && field.value.length === 4 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="flex items-center justify-center gap-2 mt-2"
                      >
                        <div className="flex items-center space-x-1">
                          <div
                            className={`h-2 w-8 rounded-full ${pinStrength === "weak" ? strengthColors.weak : "bg-gray-200"}`}
                          ></div>
                          <div
                            className={`h-2 w-8 rounded-full ${pinStrength === "medium" || pinStrength === "strong" ? strengthColors[pinStrength] : "bg-gray-200"}`}
                          ></div>
                          <div
                            className={`h-2 w-8 rounded-full ${pinStrength === "strong" ? strengthColors.strong : "bg-gray-200"}`}
                          ></div>
                        </div>
                        <span
                          className={`text-xs ${
                            pinStrength === "weak"
                              ? "text-red-500"
                              : pinStrength === "medium"
                                ? "text-yellow-500"
                                : "text-green-500"
                          }`}
                        >
                          {`보안 강도: ${strengthText[pinStrength]}`}
                        </span>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 ml-1"
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                {pinStrength === "weak"
                                  ? "연속된 숫자(1234)나 반복된 숫자(1111)는 추측하기 쉽습니다."
                                  : pinStrength === "medium"
                                    ? "더 안전한 PIN을 위해 무작위 숫자를 사용하세요."
                                    : "좋은 PIN 입니다! 잊지 마세요."}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </motion.div>
                    )}

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
                            <Lock className="h-3 w-3" /> PIN 숨기기
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Unlock className="h-3 w-3" /> PIN 표시하기
                          </span>
                        )}
                      </Button>
                    </div>
                    <FormMessage className="text-center" />
                  </FormItem>
                )}
              />

              {/* 숫자 키패드 */}
              <div className="mt-6 max-w-[280px] mx-auto">
                {" "}
                {/* 키패드 중앙 정렬 */}
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

              {/* 단계별 화면 전환 버튼 */}
              <div className="flex justify-between pt-4">
                {step === "confirm" && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        toast("이전 단계로 돌아갑니다", {
                          icon: "⬅️",
                          duration: 1500,
                        });
                        setStep("create");
                        setFirstPin("");
                        setAttempts(0);
                        form.reset();
                      }}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      이전 단계
                    </Button>
                  </motion.div>
                )}

                {step === "create" && form.watch("pin").length === 4 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-auto"
                  >
                    <Button
                      type="button"
                      onClick={form.handleSubmit(onSubmit)}
                      className="flex items-center gap-2"
                    >
                      다음 단계
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 진행 단계 표시기 */}
      <div className="flex items-center gap-2 mt-6">
        <motion.div
          animate={{
            backgroundColor:
              step === "create" ? "var(--primary)" : "var(--muted)",
          }}
          className="h-2 w-10 rounded-full"
        />
        <motion.div
          animate={{
            backgroundColor:
              step === "confirm" ? "var(--primary)" : "var(--muted)",
          }}
          className="h-2 w-10 rounded-full"
        />
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        PIN은 API 키를 안전하게 보호하는 데 사용됩니다.
        <br />
        PIN을 잊어버린 경우 모든 계정 데이터를 새로 설정해야 합니다.
      </p>
    </div>
  );
};

export default SetPin;
