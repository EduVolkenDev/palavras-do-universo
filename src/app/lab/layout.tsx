import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  alternates: { canonical: "/lab" },
};

export default function LabLayout({ children }: { children: ReactNode }) {
  return children;
}
