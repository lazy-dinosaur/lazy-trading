import { Button } from "@/components/ui/button";
import { useSettings } from "@/contexts/settings/use";
import { Moon, Sun, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ThemeType } from "@/contexts/settings/type";
import { useTranslation } from "react-i18next";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useSettings();
  const { t } = useTranslation();

  const options: { label: string; value: ThemeType; icon: React.ReactNode }[] = [
    {
      label: t('settings.light'),
      value: "light",
      icon: <Sun className="h-4 w-4" />,
    },
    {
      label: t('settings.dark'),
      value: "dark",
      icon: <Moon className="h-4 w-4" />,
    },
    {
      label: t('settings.system'),
      value: "system",
      icon: <Monitor className="h-4 w-4" />,
    },
  ];

  const currentOption = options.find((option) => option.value === theme) || options[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
          aria-label={t('settings.theme')}
        >
          {currentOption.icon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              theme === option.value && "bg-accent"
            )}
          >
            {option.icon}
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}