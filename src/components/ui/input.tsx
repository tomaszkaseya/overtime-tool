"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none",
          "placeholder:text-gray-500",
          "focus-visible:ring-2 focus-visible:ring-offset-2",
          invalid ? "border-red-500" : "border-foreground/20",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";


