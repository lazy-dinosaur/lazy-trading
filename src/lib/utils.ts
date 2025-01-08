import { TimeFrameType } from "@/components/trade/time-frame";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const setPin = async (pin: string): Promise<boolean> => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SET_PIN",
      pin,
    });
    return response.success;
  } catch (error) {
    console.error("Failed to set PIN:", error);
    return false;
  }
};

export const getPin = async (): Promise<string | null> => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "GET_PIN",
    });
    return response.pin;
  } catch (error) {
    console.error("Failed to get PIN:", error);
    return null;
  }
};

interface LocalStorage {
  pinCreated?: boolean;
}

export const fetchPinCreated = async (): Promise<boolean> => {
  try {
    const result = (await chrome.storage.local.get([
      "pinCreated",
    ])) as LocalStorage;
    return result.pinCreated ?? false;
  } catch (error) {
    console.error("Failed to get pinCreated from storage:", error);
    throw error; // React Query가 에러를 처리할 수 있도록 throw
  }
};

export const setPinCreated = async (value: boolean): Promise<void> => {
  try {
    await chrome.storage.local.set({ pinCreated: value });
  } catch (error) {
    console.error("Failed to set pinCreated in storage:", error);
    throw error;
  }
};

export const getStarted = async (): Promise<boolean> => {
  try {
    const response = await chrome.runtime.sendMessage({ type: "GET_STARTED" });
    return response.started;
  } catch (error) {
    console.error("Failed to get started from service worker:", error);
    return false;
  }
};

export const setStarted = async (value: boolean): Promise<boolean> => {
  try {
    const response = await chrome.runtime.sendMessage({
      type: "SET_STARTED",
      value,
    });
    return response.started;
  } catch (error) {
    console.error("Failed to set started in service worker:", error);
    return false;
  }
};
export const formatTime = (timestamp: number, timeFrame: TimeFrameType) => {
  const date = new Date(timestamp * 1000);

  switch (timeFrame) {
    case "5":
    case "15":
    case "30":
    case "60":
    case "240":
      // 분봉, 시간봉은 날짜와 시간 모두 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
        hour: date.getHours(),
        minute: date.getMinutes(),
      };

    case "D":
    case "W":
    case "M":
      // 일봉, 주봉, 월봉은 날짜만 표시
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };

    default:
      return date.toISOString().split("T")[0];
  }
};

import { CandleData } from "@/components/chart/candle";

/**
 * 최근 캔들 데이터에서 손절 기준이 되는 고점/저점을 찾는 함수
 * @param data - 캔들 데이터 배열
 * @param arrLen - 현재 검색할 배열의 길이
 * @param tradeType - 'high' 또는 'low'
 * @returns 손절 기준이 되는 캔들 데이터
 */
export const searchingStopLossCandle = (
  data: CandleData[],
  arrLen: number,
  tradeType: "high" | "low",
): CandleData => {
  // 최근 3개의 캔들 값을 저장할 배열
  const candles: number[] = [];

  // 최근 3개의 캔들에서 고점 또는 저점 값을 수집
  for (let i = 0; i < 3; i++) {
    if (arrLen - i >= 0 && data[arrLen - i]) {
      candles.push(data[arrLen - i][tradeType]);
    }
  }

  // 배열이 비어있으면 마지막 캔들 반환
  if (candles.length === 0) {
    return data[data.length - 1];
  }

  // 고점/저점의 인덱스 찾기
  let extremeIndex: number;
  if (tradeType === "low") {
    // 저점인 경우 최소값의 인덱스
    extremeIndex = candles.indexOf(Math.min(...candles));
  } else {
    // 고점인 경우 최대값의 인덱스
    extremeIndex = candles.indexOf(Math.max(...candles));
  }

  // 현재 구간의 첫 번째 캔들이 고점/저점인 경우
  if (extremeIndex === 0) {
    // 해당 값을 가진 캔들들 중 가장 최근 캔들 찾기
    const matchingCandles = data.filter(
      (candle) => candle[tradeType] === candles[extremeIndex],
    );
    return matchingCandles[matchingCandles.length - 1];
  }

  // 고점/저점이 첫 번째 캔들이 아닌 경우 재귀적으로 이전 구간 검색
  return searchingStopLossCandle(data, arrLen - extremeIndex, tradeType);
};

/**
 * 차트에 표시할 마커 데이터 생성
 */
export const getStopLossMarkers = (data: CandleData[]) => {
  if (data.length < 3) return [];

  const highMarker = searchingStopLossCandle(data, data.length - 1, "high");
  const lowMarker = searchingStopLossCandle(data, data.length - 1, "low");

  return [
    {
      time: highMarker.time,
      position: "aboveBar" as const,
      color: "#ef4444",
      shape: "arrowDown" as const,
      text: `High: ${highMarker.high.toFixed(2)}`,
    },
    {
      time: lowMarker.time,
      position: "belowBar" as const,
      color: "#22c55e",
      shape: "arrowUp" as const,
      text: `Low: ${lowMarker.low.toFixed(2)}`,
    },
  ];
};
