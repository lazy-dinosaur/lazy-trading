import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullHeight?: boolean;
}

export function LoadingSpinner({ 
  text = "로딩 중...", 
  size = "md", 
  className,
  fullHeight = true 
}: LoadingSpinnerProps) {
  // 사이즈에 따른 스피너 크기 설정
  const spinnerSize = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  }[size];
  
  // 사이즈에 따른 텍스트 크기 설정
  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[size];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-2", 
      fullHeight && "w-full h-full",
      className
    )}>
      <div className="relative">
        <Loader2 className={cn("animate-spin text-primary", spinnerSize)} />
        <div className="absolute inset-0 animate-pulse opacity-50 rounded-full blur-sm bg-primary/30" />
      </div>
      {text && <p className={cn("text-muted-foreground font-medium", textSize)}>{text}</p>}
    </div>
  );
}

export function OverlayLoader({ text = "처리 중..." }) {
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-card p-4 rounded-lg shadow-lg border flex flex-col items-center">
        <LoadingSpinner text={text} fullHeight={false} />
      </div>
    </div>
  );
}

