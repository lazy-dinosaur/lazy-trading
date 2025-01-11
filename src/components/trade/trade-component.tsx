import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "../ui/button";
import { getTradingConfig, setTradingConfig } from "@/lib/appStorage";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  AccountInfo,
  AccountInfoType,
  BalancesType,
} from "@/hooks/useAccountsInfo";
import { useParams } from "react-router";

export const TradeComponent = ({
  id,
  accountsInfo,
}: {
  id?: string;
  accountsInfo?: AccountInfoType;
}) => {
  const [risk, setRisk] = useState<number | null>(null);

  // 초기 설정 로드
  useEffect(() => {
    const loadInitialConfig = async () => {
      try {
        const tradingConfig = await getTradingConfig();
        if (tradingConfig?.risk) {
          setRisk(tradingConfig.risk);
        } else {
          setRisk(1.5); // 기본값
        }
      } catch (error) {
        console.error("Failed to load trading config:", error);
        setRisk(1.5); // 에러 시 기본값
      }
    };

    loadInitialConfig();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // risk 값이 변경될 때 저장
  useEffect(() => {
    const saveConfig = async () => {
      if (risk !== null) {
        try {
          await setTradingConfig({ risk });
          console.log("Trading config saved:", { risk });
        } catch (error) {
          console.error("Failed to save trading config:", error);
        }
      }
    };
    saveConfig();
  }, [risk]); // risk가 변경될 때만 실행
  useEffect(() => {
    console.log(accountsInfo);
  }, [accountsInfo]);

  return (
    <div className="w-full h-40">
      <div className="h-3/5 w-full grid grid-cols-12 pb-2 gap-1">
        <AssetInfo
          assets={accountsInfo && !!id ? accountsInfo[id].balance : undefined}
        />
        <TradingInfo
          accountsInfo={accountsInfo && !!id ? accountsInfo[id] : undefined}
        />
        <RiskSetting riskState={{ risk, setRisk }} />
      </div>
      <div className="w-full flex justify-between h-2/5 items-center">
        <Button variant={"long"} className="w-1/2 mx-2 opacity-90">
          LONG
        </Button>
        <Button variant={"short"} className="w-1/2 mx-2 opacity-90">
          SHORT
        </Button>
      </div>
    </div>
  );
};
const AssetInfo = ({ assets }: { assets: BalancesType | undefined }) => {
  const { base } = useParams();
  const baseAsset = base?.split(":")[1];
  const baseAssetInfo = baseAsset && assets && assets?.[baseAsset];
  const total = assets?.usd.total;
  const used = assets?.usd.used;
  const free = assets?.usd.free;

  return (
    <>
      <div className="h-full col-span-1">
        <div className="text-xs text-muted-foreground mb-1">Assets</div>
        <div className="capitalize">total:</div>
        <div className="capitalize">free:</div>
        <div className="capitalize">used:</div>
      </div>
      <div className="h-full col-span-2">
        <div className="text-xs text-muted-foreground mb-1">InUSD</div>
        {assets ? (
          <>
            <div className="capitalize">${total}</div>
            <div className="capitalize">${free}</div>
            <div className="capitalize">${used}</div>
          </>
        ) : (
          <>
            <div className="">스켈레톤 로딩 예정</div>
          </>
        )}
      </div>
      <div className="h-full col-span-2">
        {assets ? (
          <>
            <div className="text-xs text-muted-foreground mb-1">
              {baseAsset}
            </div>
            <div className="capitalize">
              {baseAssetInfo ? baseAssetInfo.total : 0}
            </div>
            <div className="capitalize">
              {baseAssetInfo ? baseAssetInfo.free : 0}
            </div>
            <div className="capitalize">
              {baseAssetInfo ? baseAssetInfo.free : 0}
            </div>
          </>
        ) : (
          <>
            <div className="">스켈레톤 로딩 예정</div>
          </>
        )}
      </div>
    </>
  );
};

const TradingInfo = ({ accountsInfo }: { accountsInfo?: AccountInfo }) => {
  return (
    <div className="h-full border col-span-5">
      <div className="text-xs text-muted-foreground mb-1">TradingInfo</div>
      {accountsInfo ? (
        <>
          <div className="capitalize text-muted-foreground">StopLossHigh</div>
          <div className="capitalize text-muted-foreground">StopLossLow</div>
        </>
      ) : (
        <>
          <div className="">스켈레톤 로딩 예정</div>
        </>
      )}
    </div>
  );
};

const RiskSetting = ({
  riskState,
}: {
  riskState: {
    risk: number | null;
    setRisk: Dispatch<SetStateAction<number | null>>;
  };
}) => {
  const { risk, setRisk } = riskState;

  return (
    <div className="h-full col-span-2">
      <div className="flex h-full w-full items-center justify-center">
        <span className="flex h-full w-full items-center justify-center flex-col">
          <span className="text-xs text-muted-foreground">Risk</span>
          <span className="text-sm font-semibold">{risk}%</span>
        </span>
        <span className="flex h-full w-full items-center justify-center gap-1 flex-col text-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-accent border-t"
            onClick={() =>
              setRisk((value) =>
                value ? (value + 0.5 > 5 ? 5 : value + 0.5) : 1.5,
              )
            }
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-accent border-b"
            onClick={() =>
              setRisk((value) =>
                value ? (value - 0.5 < 0.5 ? 0.5 : value - 0.5) : 1.5,
              )
            }
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </span>
      </div>
    </div>
  );
};
