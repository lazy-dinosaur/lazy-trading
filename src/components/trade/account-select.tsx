import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DecryptedAccount,
  ExchangeType,
  useAccounts,
} from "@/hooks/useAccounts";
import { useAccountsInfo } from "@/hooks/useAccountsInfo";
import React, { useEffect } from "react";

export const AccountSelector = ({
  accountState: { accounts, setAccounts },
  selectedState: { selected, setSelected },
  exchange,
}: {
  accountState: {
    accounts?: DecryptedAccount[];
    setAccounts: React.Dispatch<
      React.SetStateAction<DecryptedAccount[] | undefined>
    >;
  };
  selectedState: {
    selected: number;
    setSelected: React.Dispatch<React.SetStateAction<number>>;
  };
  exchange?: ExchangeType;
}) => {
  const { useAllDecryptedAccounts } = useAccounts();
  const decryptedAccounts = useAllDecryptedAccounts();
  const { data } = useAccountsInfo();

  useEffect(() => {
    if (!accounts && decryptedAccounts.data) {
      setAccounts(() =>
        Object.values(decryptedAccounts.data).filter(
          (value) => value.exchange === exchange,
        ),
      );
    }
  }, [decryptedAccounts.data]);

  useEffect(() => {
    console.log(data);
  }, [data]);

  return (
    accounts && (
      <Select
        defaultValue={selected.toString()}
        onValueChange={(value) => {
          setSelected(Number(value));
        }}
      >
        <SelectTrigger className="w-32 h-6">
          <SelectValue placeholder="Account" />
        </SelectTrigger>
        <SelectContent className="max-h-48">
          <SelectGroup>
            {accounts?.map((account, index) => {
              const id = accounts[index].id;
              const totalBalance = data && (data[id].balance.total as any).USDT;
              return (
                <div>
                  <SelectItem key={id} className="h-5" value={index.toString()}>
                    {account.name}
                  </SelectItem>
                  <div className="text-xs opacity-85 px-2">
                    <span>Total:{`${totalBalance}`}</span>
                    <span></span>
                  </div>
                </div>
              );
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  );
};
