"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomTabBar() {
  const pathname = usePathname();

  const tabs = [
    {
      name: "Home",
      path: "/dashboard",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          {active ? null : <polyline points="9 22 9 12 15 12 15 22"></polyline>}
        </svg>
      )
    },
    {
      name: "Mutuals",
      path: "/mutuals",
      isActive: pathname.startsWith("/directory") || pathname.startsWith("/results") || pathname === "/mutuals",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      )
    },
    {
      name: "Compatible",
      path: "/compatible",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.2" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      )
    },
    {
      name: "Profile",
      path: "/profile",
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? "0" : "1.75"} strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      )
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-brand-charcoal/95 backdrop-blur-2xl border-t border-brand-burgundy/25 shadow-[0_-8px_32px_rgba(0,0,0,0.5)]">
      <nav className="max-w-md mx-auto px-8 py-3.5 flex justify-between items-center">
        {tabs.map((tab) => {
          const isActive = tab.isActive ?? pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.name}
              href={tab.path}
              className={`flex flex-col items-center justify-center py-1 px-3 gap-1 rounded-xl transition-all duration-200 ${
                isActive ? "text-brand-blush" : "text-brand-taupe hover:text-brand-blush/70"
              }`}
            >
              <div className="relative flex items-center justify-center">
                {tab.icon(isActive)}
                {isActive && (
                  <span className="absolute -bottom-2 w-1 h-1 bg-brand-rose rounded-full" />
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-wider mt-1 ${isActive ? "text-brand-blush font-semibold" : "text-brand-taupe"}`}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
