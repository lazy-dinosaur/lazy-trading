import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { APP_STATE_KEY, getAppState, updateAppState } from "@/lib/appState";
import { useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

const LOADED_KEY = ["app-loaded"];

export const useAppStateCache = () => {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: isLoaded = false } = useQuery({
    queryKey: LOADED_KEY,
    queryFn: () => false,
    staleTime: Infinity,
  });

  const setLoaded = useCallback(
    (value: boolean) => {
      queryClient.setQueryData(LOADED_KEY, value);
    },
    [queryClient],
  );

  // 앱 상태 조회
  const {
    data: appState,
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: APP_STATE_KEY,
    queryFn: getAppState,
    enabled: !isLoaded,
    staleTime: Infinity,
  });

  // 앱 상태 업데이트
  const { mutate: updateState } = useMutation({
    mutationFn: updateAppState,
    onSuccess: (newState) => {
      queryClient.setQueryData(APP_STATE_KEY, newState);
    },
  });

  // 라우트 데이터 업데이트 함수

  useEffect(() => {
    if (isFetched && !isLoaded && !isLoading && appState) {
      navigate(appState.currentRoute ? appState.currentRoute : "/dashboard");
      setLoaded(true);
    }
  }, [appState, isLoading, isFetched, isLoaded, navigate, setLoaded]);

  useEffect(() => {
    if (
      isLoaded &&
      appState &&
      location.pathname != "/" &&
      appState.currentRoute != location.pathname
    ) {
      updateState({ ...appState, currentRoute: location.pathname });
    }
  }, [location, isLoaded, setLoaded]);

  return {
    appState,
    isLoading,
    isFetched,
    setLoaded,
    updateState,
    isLoaded,
  };
};
