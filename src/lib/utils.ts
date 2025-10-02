import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<string | number | null | undefined | false>) {
  return twMerge(clsx(inputs));
}


