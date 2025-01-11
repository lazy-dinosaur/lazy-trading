import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExchangeType, useAccounts } from "@/hooks/useAccounts";

import { AccountInfoType } from "@/hooks/useAccountsInfo";
import { DecryptedAccount } from "@/lib/appStorage";
import React, { useEffect } from "react";

export const AccountSelector = ({
  accountState: { accounts, setAccounts },
  selectedState: { selected, setSelected },
  accountsInfo,
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
  accountsInfo?: AccountInfoType;
  exchange?: ExchangeType;
}) => {
  const { useAllDecryptedAccounts } = useAccounts();
  const decryptedAccounts = useAllDecryptedAccounts();

  useEffect(() => {
    if (!accounts && decryptedAccounts.data) {
      setAccounts(() =>
        Object.values(decryptedAccounts.data).filter(
          (value) => value.exchange === exchange,
        ),
      );
    }
  }, [decryptedAccounts.data]);

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
              const totalBalance =
                accountsInfo && accountsInfo[id].balance.usd.total;
              return (
                <div>
                  <SelectItem key={id} className="h-5" value={index.toString()}>
                    {account.name}
                  </SelectItem>
                  <div className="text-xs text-muted-foreground px-2">
                    <span>Total: ${`${totalBalance}`}</span>
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
