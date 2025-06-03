import { useQuery } from "@tanstack/react-query";

export const useFetchLocalStorage = (key: string) =>
  useQuery({
    queryKey: [key],
    queryFn: async ({ queryKey }) => {
      const [key] = queryKey;
      try {
        const result = await chrome.storage.local.get([key]);
        return result[key];
      } catch (e) {
        console.log(e);
        throw new Error("로컬 스토리지에서 데이터를 가져오지 못함");
      }
    },
  });
