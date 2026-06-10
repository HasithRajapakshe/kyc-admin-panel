import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function formatDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function maskNic(nic?: string) {
  if (!nic) return "—";
  return nic.slice(0, 4) + "••••" + nic.slice(-2);
}

export function getRisk(score: number) {
  if (score >= 70) return { label: "High",   bg: "#FEE2E2", color: "#7F1D1D", bar: "#EF4444" };
  if (score >= 40) return { label: "Medium", bg: "#FEF3C7", color: "#92400E", bar: "#F59E0B" };
  return             { label: "Low",    bg: "#DCFCE7", color: "#14532D", bar: "#22C55E" };
}

export const ROLE_LABELS: Record<string, string> = {
  USR: "KYC Officer",
  ADM: "Admin",
  SAD: "Super Admin",
};

export const ROLE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  "Super Admin": { bg: "#EDE9FE", color: "#4C1D95", border: "#C4B5FD" },
  "Admin":       { bg: "#DBEAFE", color: "#1E3A8A", border: "#93C5FD" },
  "KYC Officer": { bg: "#FFF3CC", color: "#C98B00", border: "#FFE082" },
  SAD:           { bg: "#EDE9FE", color: "#4C1D95", border: "#C4B5FD" },
  ADM:           { bg: "#DBEAFE", color: "#1E3A8A", border: "#93C5FD" },
  USR:           { bg: "#FFF3CC", color: "#C98B00", border: "#FFE082" },
};