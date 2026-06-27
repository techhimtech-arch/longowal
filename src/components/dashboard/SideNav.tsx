import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

const items = [
  { icon: "dashboard", label: "Dashboard", path: "/", roles: ["Admin", "Sales Executive", "Operations", "Accounts"] },
  { icon: "groups", label: "Leads", path: "/leads", roles: ["Admin", "Sales Executive"] },
  { icon: "shopping_bag", label: "Orders", path: "/orders", roles: ["Admin", "Sales Executive", "Operations", "Accounts"] },
  { icon: "group", label: "Users", path: "/users", roles: ["Admin"] },
  { icon: "account_balance_wallet", label: "Collections", path: "/collections", roles: ["Admin", "Accounts"] },
  { icon: "assessment", label: "Reports", path: "/reports", roles: ["Admin", "Accounts"] },
  { icon: "settings", label: "Settings", path: "/settings", roles: ["Admin", "Sales Executive", "Operations", "Accounts"] },
];

export function SideNav() {
  const { user, logout } = useAuth();

  // Filter items based on user role
  const visibleItems = items.filter(
    (it) => !it.roles || (user?.role && it.roles.includes(user.role))
  );

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-surface border-r border-wireframe-border flex flex-col">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-wireframe-border">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-on-primary font-bold">
          L
        </div>
        <div>
          <p className="font-headline-sm text-headline-sm">OOMS</p>
          <p className="font-label-sm text-label-sm text-outline">Longowal Group</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 font-label-sm text-label-sm text-outline uppercase tracking-wider">
          Main Menu
        </p>
        {visibleItems.map((it) => (
          <Link
            key={it.label}
            to={it.path}
            activeProps={{
              className: "bg-primary-container/40 text-primary font-semibold"
            }}
            inactiveProps={{
              className: "text-secondary hover:bg-wireframe-bg-alt"
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-left font-label-md text-label-md transition-colors`}
          >
            <span className="material-symbols-outlined text-[20px]">{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-wireframe-border flex items-center gap-3 bg-wireframe-bg-alt/30">
        <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-[12px] uppercase">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-md text-label-md truncate font-bold text-foreground">
            {user?.name || "Log In"}
          </p>
          <p className="font-label-sm text-label-sm text-outline truncate">
            {user?.role || "Employee"}
          </p>
        </div>
        <button 
          onClick={logout}
          className="p-1 hover:bg-red-50 hover:text-red-600 rounded transition-all text-outline"
          title="Sign Out"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
        </button>
      </div>
    </aside>
  );
}