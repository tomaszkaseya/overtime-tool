"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <ToastPrimitive.Provider>{children}</ToastPrimitive.Provider>;
}

export const ToastViewport = () => (
  <ToastPrimitive.Viewport
    className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[100vw] flex-col gap-2 outline-none"
  />
);

type ToastProps = {
  title?: string;
  description?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Toast({ title, description, open, onOpenChange }: ToastProps) {
  return (
    <ToastPrimitive.Root
      className={cn(
        "rounded-md border border-foreground/20 bg-background p-3 shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out"
      )}
      open={open}
      onOpenChange={onOpenChange}
    >
      {title && (
        <ToastPrimitive.Title className="text-sm font-medium">{title}</ToastPrimitive.Title>
      )}
      {description && (
        <ToastPrimitive.Description className="text-sm text-gray-600">
          {description}
        </ToastPrimitive.Description>
      )}
    </ToastPrimitive.Root>
  );
}


