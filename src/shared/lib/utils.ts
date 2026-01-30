import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Утилита для объединения классов Tailwind.
 * Позволяет использовать условные классы и корректно переопределять их.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}