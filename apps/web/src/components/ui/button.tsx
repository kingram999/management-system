import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition disabled:opacity-50",
        size === "sm" && "rounded-lg px-3 py-1.5 text-sm",
        size === "md" && "rounded-lg px-4 py-2.5 text-sm",
        size === "icon" && "h-9 w-9 rounded-lg",
        variant === "primary" &&
          "bg-brand text-white hover:bg-brand-dark",
        variant === "secondary" &&
          "border border-border bg-card text-foreground hover:bg-background",
        variant === "ghost" && "text-muted hover:bg-background hover:text-foreground",
        variant === "danger" && "bg-danger text-white hover:opacity-95",
        className,
      )}
      {...props}
    />
  );
}
