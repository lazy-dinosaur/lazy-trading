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
import { useTranslation } from "react-i18next";

type FormValue = {
  name: string;
  positionMode: "oneway" | "hedge";
};

const AccountEdit = () => {
  const { t } = useTranslation();
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
      <ScreenWrapper headerProps={{ title: t("account.edit_account") }}>
        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          <div className="flex flex-col items-center justify-center h-96 p-4">
            <p className="text-lg mb-4">{t("account.account_not_exist")}</p>
            <Button onClick={() => navigate("/accounts")}>
              {t("account.back_to_account_list")}
            </Button>
          </div>
        </ScrollArea>
      </ScreenWrapper>
    );
  }

  const onSubmit = async (data: FormValue) => {
    if (!account || !id) return;
    
    setIsSaving(true);
    
    try {
      // 거래소별 포지션 모드 처리
      let positionMode: "oneway" | "hedge" | undefined;
      let positionModeMessage = "";
      
      // 비트겟과 바이낸스는 현재 원웨이 모드만 지원
      if (account.exchange === "bitget" || account.exchange === "binance") {
        positionMode = "oneway";
        if (data.positionMode === "hedge") {
          positionModeMessage = account.exchange === "bitget" 
            ? t("account.bitget_oneway_auto_set") 
            : t("account.binance_oneway_auto_set");
        }
      } else {
        positionMode = data.positionMode;
      }
      
      // 계정 정보 업데이트
      const updatedAccount = {
        ...account,
        name: data.name,
        positionMode,
      };
      
      const success = await setAccount(updatedAccount);
      
      if (success) {
        if (positionModeMessage) {
          toast.success(`${t("account.account_saved")}. ${positionModeMessage}`);
        } else {
          toast.success(t("account.account_saved"));
        }
        await refreshAccounts();
        navigate("/accounts");
      } else {
        toast.error(t("account.update_account_error"));
      }
    } catch (error) {
      console.error("계정 업데이트 중 오류 발생:", error);
      toast.error(t("account.update_error_occurred"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper headerProps={{ title: t("account.edit_account") }}>
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
                    <p className="text-sm text-muted-foreground">{t("account.exchange")}</p>
                    <p className="text-lg font-medium capitalize">{account?.exchange}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("account.balance")}</p>
                    <p className="text-lg font-medium">
                      {formatUSDValue(balanceInfo?.balance?.usd?.total || 0)} USD
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{t("common.created_date")}</p>
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
                          <Label htmlFor="name">{t("account.account_name")}</Label>
                          <Input
                            {...field}
                            id="name"
                            placeholder={t("account.account_name_placeholder")}
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
                          <Label htmlFor="positionMode">{t("account.position_mode")}</Label>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            disabled={account?.exchange === "bitget" || account?.exchange === "binance"} // 비트겟과 바이낸스 계정은 비활성화
                          >
                            <SelectTrigger id="positionMode">
                              <SelectValue placeholder={t("account.select_position_mode")} />
                            </SelectTrigger>
                            <SelectContent position="popper">
                              <SelectItem value="oneway">{t("account.position_mode_oneway")}</SelectItem>
                              <SelectItem value="hedge">{t("account.position_mode_hedge")}</SelectItem>
                            </SelectContent>
                          </Select>
                          {account?.exchange === "bitget" && (
                            <div className="text-xs text-amber-500 mt-1">
                              <AlertTriangle className="h-3.5 w-3.5 inline-block mr-1" />
                              {t("account.bitget_oneway_warning")}
                            </div>
                          )}
                          {account?.exchange === "binance" && (
                            <div className="text-xs text-amber-500 mt-1">
                              <AlertTriangle className="h-3.5 w-3.5 inline-block mr-1" />
                              {t("account.binance_oneway_warning")}
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
                    {t("common.cancel")}
                  </Button>
                  <Button 
                    className="w-52" 
                    type="submit"
                    disabled={isSaving}
                  >
                    {isSaving ? t("common.saving") : t("common.save")}
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
