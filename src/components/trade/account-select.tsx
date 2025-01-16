import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExchangeType } from "@/hooks/useAccounts";

import { AccountInfoType } from "@/hooks/useAccountsInfo";
import { DecryptedAccount } from "@/lib/appStorage";
import React from "react";

export const AccountSelector = ({
  accountState: { accounts },
  selectedState: { selected, setSelected },
  accountsInfo,
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
  return (
    <Select
      defaultValue={accounts ? accounts[selected]?.name : undefined}
      onValueChange={(value) => {
        setSelected(Number(value));
      }}
    >
      <SelectTrigger className="w-32 h-8" disabled={!!accounts}>
        <SelectValue
          placeholder={
            accounts && accounts?.length > 0 ? "Account" : "No Account"
          }
        />
      </SelectTrigger>
      <SelectContent className="max-h-[30vh]">
        {accounts && (
          <SelectGroup>
            {accounts?.map((account) => {
              const { id } = account;
              const totalBalance =
                accountsInfo && accountsInfo[id].balance.usd.total;
              return (
                <div>
                  <SelectItem key={id} className="h-7" value={id}>
                    {account.name}
                  </SelectItem>
                  <div className="text-sm text-muted-foreground px-2">
                    <span>Total: ${`${totalBalance}`}</span>
                  </div>
                </div>
              );
            })}
          </SelectGroup>
        )}
      </SelectContent>
    </Select>
  );
};
