import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-md border border-line bg-bg px-3 text-base text-fg outline-none placeholder:text-subtle focus-visible:border-accent",
          className,
        )}
        {...props}
      />
    );
  },
);
