import { LoadingSpinner } from "@/components/loading";
import { useCache } from "@/contexts/cache/use";
import { useEffect } from "react";
import { useNavigate } from "react-router";

const Index = () => {
  const { cache, isLoading: isCacheLoading } = useCache();
  const navigate = useNavigate();

  useEffect(() => {
    if (cache && cache.currentRoute && !isCacheLoading) {
      navigate(cache.currentRoute, { replace: true });
    } else if (!isCacheLoading) {
      navigate("/dashboard", { replace: true });
    }
  }, [cache, isCacheLoading, navigate]);
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
};
export default Index;
