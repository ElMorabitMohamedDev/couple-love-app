import { NavLink } from "react-router";
import { BookHeart, HeartHandshake, Home, Image, Settings } from "lucide-react";

export function BottomNavigation() {
  const navItems = [
    { path: "/home", icon: Home, label: "Home" },
    { path: "/journal", icon: BookHeart, label: "Journal" },
    { path: "/support", icon: HeartHandshake, label: "Support" },
    { path: "/memories", icon: Image, label: "Memories" },
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-100 bg-white/90 shadow-[0_-10px_30px_rgba(244,114,182,0.12)] backdrop-blur-xl\">
      <div className="mx-auto max-w-md px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2\">
        <div className="mx-auto flex max-w-md items-center justify-around gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-xs transition-all ${
                  isActive
                    ? "bg-rose-50 text-rose-600"
                    : "text-gray-400 hover:bg-rose-50/70 hover:text-rose-500"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
