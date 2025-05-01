import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router";
import { useAccounts } from "@/contexts/accounts/use";
import { ScreenWrapper } from "@/components/screen-wrapper";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { setAccount } from "@/lib/accounts";
import { Card, CardContent } from "@/components/ui/card";
import { formatUSDValue } from "@/lib/utils";

type FormValue = {
  name: string;
  positionMode: "oneway" | "hedge";
};

const AccountEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, accountsBalance, refreshAccounts, isLoading } = useAccounts();
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<FormValue>({
    defaultValues: {
      name: "",
      positionMode: "oneway",
    },
  });

  // 편집 중인 계정 정보
  const account = id ? accounts?.[id] : null;
  const balanceInfo = id ? accountsBalance?.[id] : null;

  useEffect(() => {
    if (account && !isLoading) {
      form.reset({
        name: account.name,
        positionMode: account.positionMode || "oneway",
      });
    }
  }, [account, isLoading, form]);

  // 계정이 존재하지 않는 경우
  if (!isLoading && (!account || !id)) {
    return (
      <ScreenWrapper headerProps={{ title: "계정 편집" }}>
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center justify-center h-96 p-4">
            <p className="text-lg mb-4">존재하지 않는 계정입니다.</p>
            <Button onClick={() => navigate("/accounts")}>계정 목록으로 돌아가기</Button>
          </div>
        </ScrollArea>
      </ScreenWrapper>
    );
  }

  const onSubmit = async (data: FormValue) => {
    if (!account || !id) return;
    
    setIsSaving(true);
    
    try {
      // 비트겟 계정의 경우 positionMode 강제로 "oneway"로 설정
      const positionMode = account.exchange === "bitget" ? "oneway" : data.positionMode;
      
      // 계정 정보 업데이트
      const updatedAccount = {
        ...account,
        name: data.name,
        positionMode,
      };
      
      const success = await setAccount(updatedAccount);
      
      if (success) {
        if (account.exchange === "bitget" && data.positionMode === "hedge") {
          toast.success("계정 정보가 업데이트되었습니다. 비트겟 계정은 원웨이 모드로 자동 설정됩니다.");
        } else {
          toast.success("계정 정보가 업데이트되었습니다.");
        }
        await refreshAccounts();
        navigate("/accounts");
      } else {
        toast.error("계정 정보 업데이트에 실패했습니다.");
      }
    } catch (error) {
      console.error("계정 업데이트 중 오류 발생:", error);
      toast.error("계정 업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper headerProps={{ title: "계정 편집" }}>
      <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
        <div className="flex flex-col space-y-6 p-4 pb-20">
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">거래소</p>
                    <p className="text-lg font-medium capitalize">{account?.exchange}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">잔액</p>
                    <p className="text-lg font-medium">
                      {formatUSDValue(balanceInfo?.balance?.usd?.total || 0)} USD
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">생성일</p>
                    <p className="text-lg font-medium">
                      {new Date(account?.createdAt || 0).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="name">계정 이름</Label>
                          <Input
                            {...field}
                            id="name"
                            placeholder="계정 이름"
                          />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <FormField
                      control={form.control}
                      name="positionMode"
                      render={({ field }) => (
                        <FormItem>
                          <Label htmlFor="positionMode">포지션 모드</Label>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={account?.exchange === "bitget"} // 비트겟 계정은 비활성화
                          >
                            <SelectTrigger id="positionMode">
                              <SelectValue placeholder="포지션 모드 선택" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="oneway">One-Way Mode</SelectItem>
                              <SelectItem value="hedge">Hedge Mode</SelectItem>
                            </SelectContent>
                          </Select>
                          {account?.exchange === "bitget" && (
                            <div className="text-xs text-amber-500 mt-1">
                              <AlertTriangle className="h-3.5 w-3.5 inline-block mr-1" />
                              비트겟은 현재 원웨이 모드만 지원됩니다. 헷지 모드에서는 포지션 종료가 정상적으로 동작하지 않을 수 있습니다. 향후 업데이트에서 지원 예정입니다.
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-center pt-6 w-full gap-4">
                  <Button
                    className="w-52"
                    variant="outline"
                    onClick={() => navigate("/accounts")}
                    type="button"
                    disabled={isSaving}
                  >
                    취소
                  </Button>
                  <Button 
                    className="w-52" 
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
        </div>
      </ScrollArea>
    </ScreenWrapper>
  );
};

export default AccountEdit;
