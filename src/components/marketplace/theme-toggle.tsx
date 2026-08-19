import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to day theme" : "Switch to night theme"}
      title={theme === "dark" ? "Day theme" : "Night theme"}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
