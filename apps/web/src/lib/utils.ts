import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusBadge(monitorName?: string) {
  return monitorName
    ? `![${monitorName} status](${window.location.origin}/api/status-badge?monitorName=${monitorName})`
    : `![All systems status](${window.location.origin}/api/status-badge)`;
}
