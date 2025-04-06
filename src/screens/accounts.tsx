import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { useAccounts } from "@/contexts/accounts/use";
import { ScreenWrapper } from "@/components/screen-wrapper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { PlusIcon, Pencil, Trash2, Info } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatUSDValue } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { deleteAccount } from "@/lib/accounts";

const Accounts = () => {
  const navigate = useNavigate();
  const { accounts, accountsBalance, refreshAccounts, isLoading } =
    useAccounts();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const handleDeleteClick = (accountId: string) => {
    setAccountToDelete(accountId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!accountToDelete) return;

    try {
      const success = await deleteAccount(accountToDelete);
      if (success) {
        toast.success("계정이 삭제되었습니다.");
        refreshAccounts();
      } else {
        toast.error("계정 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("계정 삭제 중 오류 발생:", error);
      toast.error("계정 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleteDialogOpen(false);
      setAccountToDelete(null);
    }
  };

  return (
    <ScreenWrapper headerProps={{ title: "계정 관리" }}>
      <div className="flex flex-col space-y-4 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">내 계정 목록</h2>
          <Button onClick={() => navigate("/account/add")}>
            <PlusIcon className="h-4 w-4 mr-2" />
            계정 추가
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !accounts || Object.keys(accounts).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <p className="mb-4 text-muted-foreground">
                등록된 계정이 없습니다.
              </p>
              <Button onClick={() => navigate("/account/add")}>
                <PlusIcon className="h-4 w-4 mr-2" />
                계정 추가하기
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>거래소</TableHead>
                  <TableHead className="text-right">잔액</TableHead>
                  <TableHead className="text-right">생성일</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(accounts).map(([accountId, account]) => {
                  const balanceInfo = accountsBalance?.[accountId];
                  const balance = balanceInfo?.balance?.usd?.total || 0;
                  const date = new Date(account.createdAt).toLocaleDateString();

                  return (
                    <TableRow key={accountId}>
                      <TableCell className="font-medium">
                        {account.name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {account.exchange}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatUSDValue(balance)}
                      </TableCell>
                      <TableCell className="text-right">{date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              navigate(`/account/edit/${accountId}`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteClick(accountId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              navigate(`/account/detail/${accountId}`)
                            }
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계정 삭제</DialogTitle>
            <DialogDescription>
              이 계정을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ScreenWrapper>
  );
};

export default Accounts;
