import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Adds non-breaking space before colons for proper French typography
 */
export function formatFrenchText(text: string): string {
  return text.replace(/\s*:/g, '\u00A0:');
}
