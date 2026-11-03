import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none ring-brand placeholder:text-muted focus:ring-2",
        className,
      )}
      {...props}
    />
  );
});
