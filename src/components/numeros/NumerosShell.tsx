"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useNumerosCopy } from "@/lib/numeros/use-copy";
import styles from "./NumerosShell.module.css";

const links = [
  { path: "/numeros", key: "home", exact: true },
  { path: "/numeros/biblioteca", key: "codes", exact: false },
  { path: "/numeros/praticar", key: "practice", exact: false },
  { path: "/numeros/sabedoria", key: "wisdom", exact: false },
] as const;

export function NumerosShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { m, href } = useNumerosCopy();

  return (
    <div className={styles.shell} data-i18n-ignore="">
      <header className={styles.header}>
        <Link href={href("/")} className={styles.brand}>
          <p className={styles.house}>Palavras do Universo</p>
          <p className={styles.brandName}>{m.brand}</p>
        </Link>
        <nav className={styles.nav} aria-label={m.brand}>
          {links.map((link) => {
            const active = link.exact
              ? pathname === link.path
              : pathname === link.path ||
                (link.key === "codes" &&
                  pathname.startsWith("/numeros/") &&
                  pathname !== "/numeros/praticar" &&
                  pathname !== "/numeros/sabedoria");
            return (
              <Link
                key={link.path}
                href={href(link.path)}
                aria-current={active ? "page" : undefined}
              >
                {m.nav[link.key]}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>{m.footer}</p>
        <Link href={href("/")}>palavrasdouniverso.com</Link>
      </footer>
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}
