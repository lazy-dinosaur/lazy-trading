import { ExchangeType } from "@/lib/accounts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Exchange } from "ccxt";
import toast from "react-hot-toast";

interface UpdatePositionParams {
  ccxtInstance: Exchange;
  symbol: string;
  positionSide: "long" | "short";
  exchange: ExchangeType;
  price?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  accountId: string; // 이 변수는 onSuccess에서 사용됨
}

/**
 * 포지션의 손절가 또는 타겟가를 업데이트하는 함수
 */
async function updatePositionTPSL({
  ccxtInstance,
  symbol,
  positionSide,
  exchange,
  price,
  stopLossPrice,
  takeProfitPrice,
  accountId,
}: UpdatePositionParams) {
  // accountId를 사용해 로그 출력
  console.log(`Updating position for account ${accountId}`);
  // 토스트 알림 ID 생성 (진행 중 상태 표시용)
  const toastId = toast.loading(
    `${positionSide === "long" ? "롱" : "숏"} 포지션 설정 업데이트 중...`,
    {
      position: "bottom-center",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
      },
    },
  );

  try {
    const oppside = positionSide === "long" ? "sell" : "buy";
    const isHedgeMode = await isPositionHedgeMode(
      ccxtInstance,
      exchange,
      symbol,
    );

    // 결과를 저장할 배열
    const results = [];

    // 포지션 정보 조회 (현재 포지션 크기 확인을 위해)
    const positions = await ccxtInstance.fetchPositions([symbol]);

    // 적절한 포지션 찾기
    const currentPosition = positions.find(
      (p) => p.symbol === symbol && p.side === positionSide,
    );

    if (
      !currentPosition ||
      !currentPosition.contracts ||
      currentPosition.contracts === 0
    ) {
      throw new Error("현재 포지션을 찾을 수 없습니다.");
    }

    const positionSize = currentPosition.contracts;

    // 1. 기존 TP/SL 주문 취소
    try {
      // 기존 주문 가져오기
      const openOrders = await ccxtInstance.fetchOpenOrders(symbol);

      // TP/SL 주문 필터링 (reduceOnly가 true인 주문)
      const tpslOrders = openOrders.filter(
        (o) =>
          (o.reduceOnly === true ||
            o.info?.reduceOnly === true ||
            o.info?.reduce_only === true) &&
          (positionSide === "long" ? o.side === "sell" : o.side === "buy"),
      );

      // 기존 TP/SL 주문 취소
      for (const order of tpslOrders) {
        await ccxtInstance.cancelOrder(order.id, symbol);
      }

      console.log(`${tpslOrders.length}개의 기존 TP/SL 주문 취소 완료`);
    } catch (error) {
      console.warn("기존 주문 취소 중 오류 발생:", error);
      // 진행은 계속합니다 (기존 주문이 없을 수도 있음)
    }

    // 2. 손절가 설정 (있는 경우)
    if (stopLossPrice) {
      try {
        // 거래소별 파라미터 설정
        let params: any = {
          reduceOnly: true,
        };

        if (exchange === "binance") {
          params = {
            ...params,
            positionSide: positionSide.toUpperCase(),
            stopLossPrice: stopLossPrice,
            hedged: true,
          };
        } else if (exchange === "bybit") {
          // 바이빗 계정의 포지션 모드에 따라 다른 파라미터 사용
          // 롱 포지션일 경우 "below", 숏 포지션일 경우 "above"
          const triggerDirection = positionSide === "long" ? "below" : "above";

          if (isHedgeMode) {
            params = {
              ...params,
              positionIdx: positionSide === "long" ? 1 : 2,
              triggerPrice: stopLossPrice, // stop_market 주문에서는 triggerPrice 사용
              stopPrice: stopLossPrice, // 일부 API 버전에서는 stopPrice 사용
              triggerDirection: triggerDirection, // 트리거 방향 명시
              closeOnTrigger: true, // 트리거 시 포지션 종료
              reduceOnly: true, // 포지션 크기만 줄이는 용도
            };
          } else {
            params = {
              ...params,
              positionIdx: 0,
              triggerPrice: stopLossPrice, // stop_market 주문에서는 triggerPrice 사용
              stopPrice: stopLossPrice, // 일부 API 버전에서는 stopPrice 사용
              triggerDirection: triggerDirection, // 트리거 방향 명시
              closeOnTrigger: true, // 트리거 시 포지션 종료
              reduceOnly: true, // 포지션 크기만 줄이는 용도
            };
          }
        } else if (exchange === "bitget") {
          params = {
            ...params,
            stopLoss: {
              triggerPrice: stopLossPrice,
            },
            holdSide: positionSide,
            hedged: true,
          };
        }

        // 손절 주문 생성
        let slResult;

        if (exchange === "bybit") {
          // Bybit의 경우 CCXT의 createOrder 메서드를 사용하지만 파라미터 조정
          // const orderType = "market"; // 사용되지 않으므로 제거

          // Bybit의 파라미터 구성 (V5 API 기준 단순화)
          // Bybit의 파라미터 구성 (V5 API 기준 단순화)
          const bybitParams = {
            orderType: "market", // 명시적으로 market 타입 지정
            reduceOnly: true,
            // closeOnTrigger: true, // reduceOnly로 충분할 수 있음, 제거 후 테스트
            triggerPrice: stopLossPrice, // V5에서는 triggerPrice 사용
            triggerDirection: positionSide === "long" ? 2 : 1, // 롱: 가격 하락 시(2), 숏: 가격 상승 시(1)
            orderLinkId: `sl_${symbol}_${Date.now()}`, // 고유 주문 ID 생성
            ...(isHedgeMode
              ? { positionIdx: positionSide === "long" ? 1 : 2 }
              : { positionIdx: 0 }),
          };

          // CCXT createOrder 메서드를 사용
          slResult = await ccxtInstance.createOrder(
            symbol,
            "market", // 일반 market 타입 사용 + params로 조건부 설정 유도
            oppside,
            positionSize,
            undefined, // 시장가 주문은 가격 설정 불필요
            bybitParams,
          );
          console.log("Bybit 손절 주문 결과:", slResult);
        } else {
          // 다른 거래소는 기존 방식 사용
          const orderType = "stop";

          slResult = await ccxtInstance.createOrder(
            symbol,
            orderType,
            oppside,
            positionSize,
            price || stopLossPrice, // 가격 우선 사용, 없으면 트리거 가격 사용
            params,
          );
        }

        results.push(slResult);
        console.log("손절가 설정 완료:", slResult);
      } catch (error) {
        console.error("손절가 설정 실패:", error);
        throw new Error(
          `손절가 설정 실패: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`,
        );
      }
    }

    // 3. 타겟가 설정 (있는 경우)
    if (takeProfitPrice) {
      try {
        // 거래소별 파라미터 설정
        let params: any = {
          reduceOnly: true,
        };

        if (exchange === "binance") {
          params = {
            ...params,
            positionSide: positionSide.toUpperCase(),
            takeProfitPrice: takeProfitPrice,
            hedged: true,
          };
        } else if (exchange === "bybit") {
          // 바이빗 계정의 포지션 모드에 따라 다른 파라미터 사용
          if (isHedgeMode) {
            params = {
              ...params,
              positionIdx: positionSide === "long" ? 1 : 2,
            };
          } else {
            params = {
              ...params,
              positionIdx: 0,
            };
          }
        } else if (exchange === "bitget") {
          params = {
            ...params,
            holdSide: positionSide,
            hedged: true,
          };
        }

        // 타겟 주문 생성
        let tpResult;

        if (exchange === "bybit") {
          // Bybit의 경우 CCXT의 createOrder 메서드 사용

          // Bybit의 파라미터 구성 (V5 API 기준 단순화)
          const bybitParams = {
            reduceOnly: true,
            // takeProfit: true, // limit 주문과 reduceOnly로 충분
            orderLinkId: `tp_${symbol}_${Date.now()}`, // 고유 주문 ID 생성
            ...(isHedgeMode
              ? { positionIdx: positionSide === "long" ? 1 : 2 }
              : { positionIdx: 0 }),
          };

          // CCXT createOrder 메서드를 사용
          tpResult = await ccxtInstance.createOrder(
            symbol,
            "limit", // 지정가 주문 유형 사용
            oppside,
            positionSize,
            takeProfitPrice, // 지정가 주문은 가격 필수
            bybitParams,
          );
          console.log("Bybit 타겟 주문 결과:", tpResult);
        } else {
          // 다른 거래소는 기존 방식 사용
          tpResult = await ccxtInstance.createOrder(
            symbol,
            "limit",
            oppside,
            positionSize,
            takeProfitPrice,
            params,
          );
        }

        results.push(tpResult);
        console.log("타겟가 설정 완료:", tpResult);
      } catch (error) {
        console.error("타겟가 설정 실패:", error);
        throw new Error(
          `타겟가 설정 실패: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`,
        );
      }
    }

    // 성공 메시지 표시
    toast.success(
      `${symbol} ${
        positionSide === "long" ? "롱" : "숏"
      } 포지션 설정 업데이트 완료!`,
      {
        id: toastId,
        icon: "✅",
        style: {
          borderRadius: "10px",
          background: positionSide === "long" ? "#10b981" : "#ef4444",
          color: "#fff",
        },
      },
    );

    return results;
  } catch (error) {
    console.error("포지션 설정 업데이트 실패:", error);

    // 오류 메시지 표시
    toast.error(
      `설정 업데이트 실패: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`,
      {
        id: toastId,
        icon: "❌",
        duration: 5000,
        style: {
          borderRadius: "10px",
          background: "#f43f5e",
          color: "#fff",
        },
      },
    );

    throw error;
  }
}

/**
 * 계정이 헷지 모드인지 확인하는 함수
 */
async function isPositionHedgeMode(
  ccxtInstance: Exchange,
  exchange: ExchangeType,
  symbol: string,
): Promise<boolean> {
  try {
    if (exchange === "binance") {
      // @ts-expect-error // ccxt types might not fully cover this specific private call
      const response = await ccxtInstance.fapiPrivateGetPositionSideDual();
      return (
        response.dualSidePosition === true ||
        response.dualSidePosition === "true"
      );
    } else if (exchange === "bybit") {
      const response = await ccxtInstance.fetchPositionMode(symbol);
      // response 객체와 hedged 속성 존재 여부 확인
      return !!(
        response &&
        typeof response === "object" &&
        "hedged" in response &&
        (response.hedged === true || response.hedged === "true")
      );
    } else if (exchange === "bitget") {
      // Bitget은 항상 헷지 모드를 지원한다고 가정
      return true;
    }
    return false;
  } catch (error) {
    console.warn("포지션 모드 확인 중 오류 발생:", error);
    return false; // 기본값은 단방향 모드
  }
}

/**
 * 포지션의 손절가/타겟가를 업데이트하는 hook
 */
export function usePositionTPSL() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePositionTPSL,
    onSuccess: (_, variables) => {
      // 캐시 무효화 - 여기서 accountId가 사용됨!
      const { symbol, exchange, accountId } = variables;

      // 여기서 accountId를 사용함
      queryClient.invalidateQueries({
        queryKey: ["positions", exchange, accountId, symbol],
      });

      // 주문 쿼리도 무효화
      queryClient.invalidateQueries({
        queryKey: ["openOrders", exchange, accountId],
      });
    },
  });
}
