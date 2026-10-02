import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  alternates: { canonical: "/tiradas" },
};

export default function TiradasLayout({ children }: { children: ReactNode }) {
  return children;
}
