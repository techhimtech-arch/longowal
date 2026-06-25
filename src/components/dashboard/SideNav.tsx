import { Link } from "@tanstack/react-router";

const items = [
  { icon: "dashboard", label: "Dashboard", path: "/" },
  { icon: "groups", label: "Leads", path: "/leads" },
  { icon: "shopping_bag", label: "Orders", path: "/orders" },
  { icon: "group", label: "Users", path: "/users" },
  { icon: "account_balance_wallet", label: "Collections", path: "/collections" },
  { icon: "assessment", label: "Reports", path: "/reports" },
  { icon: "settings", label: "Settings", path: "/settings" },
];

export function SideNav() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-surface border-r border-wireframe-border flex flex-col">
      <div className="h-16 flex items-center gap-2 px-6 border-b border-wireframe-border">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-on-primary font-bold">
          C
        </div>
        <div>
          <p className="font-headline-sm text-headline-sm">CMD</p>
          <p className="font-label-sm text-label-sm text-outline">Enterprise Suite</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 font-label-sm text-label-sm text-outline uppercase tracking-wider">
          Main
        </p>
        {items.map((it) => (
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
      <div className="p-4 border-t border-wireframe-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-[12px]">
          RK
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-label-md text-label-md truncate">Rohan Kapoor</p>
          <p className="font-label-sm text-label-sm text-outline truncate">CMD, Operations</p>
        </div>
        <span className="material-symbols-outlined text-outline text-[18px]">logout</span>
      </div>
    </aside>
  );
}