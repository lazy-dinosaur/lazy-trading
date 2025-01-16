import { LoadingSpinner } from "@/components/loading";
import { useFetchCache } from "@/hooks/cache";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Index = () => {
  const { data: cacheData, isLoading: isCacheLoading } = useFetchCache();
  const navigate = useNavigate();

  useEffect(() => {
    if (cacheData && cacheData.currentRoute && !isCacheLoading) {
      navigate(cacheData.currentRoute, { replace: true });
    } else if (!isCacheLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [cacheData, isCacheLoading, navigate]);
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* <div className="h-[100vh] w-full"> */}
      <LoadingSpinner />
    </div>
  );
};
export default Index;
