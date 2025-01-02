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
import { useExchange } from "@/hooks/useExchange";
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
  const {
    setExchange: { mutate },
  } = useExchange();
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

  useEffect(() => {
    if (!!accounts && selected) {
      const { exchange, apiKey, secretKey } = accounts[selected];
      mutate({ exchange, apikey: apiKey, secret: secretKey });
    }
  }, [selected, accounts]);

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
        <SelectContent>
          <SelectGroup>
            {accounts?.map((account, index) => (
              <SelectItem className="h-5" value={index.toString()}>
                {account.name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    )
  );
};
