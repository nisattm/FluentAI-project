"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  title: string;
  hint: string;
  icon: string;
};

const items: NavItem[] = [
  { href: "/dashboard", title: "Dashboard", hint: "Günlük plan", icon: "🏠" },
  { href: "/writing", title: "Writing", hint: "AI düzeltir", icon: "✍️" },
  { href: "/listening", title: "Listening", hint: "AI voice → yaz", icon: "🎧" },
  { href: "/ai-learn", title: "AI ile öğrenme", hint: "Senaryolar", icon: "🤖" },
  { href: "/vocab", title: "Vocab", hint: "Günlük kelime", icon: "📚" },
  { href: "/practice", title: "Practice", hint: "Quiz", icon: "✅" },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname?.startsWith(href + "/");
  }

  return (
    <aside className="glass sidebar">
      <div className="brandRow">
        <div className="brandLogo">AD</div>
        <div>
          <div className="brandTitle">FluentAI</div>
          <div className="brandSub">AI tabanlı öğrenme</div>
        </div>
      </div>

      <nav className="nav">
        {items.map((it) => {
          const active = isActive(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={active ? "navItem navItemActive" : "navItem"}
            >
              <span>
                {it.icon} {it.title}
              </span>
              <span className="hint">{it.hint}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
