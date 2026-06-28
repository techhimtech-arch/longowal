import { Link } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';

interface NavItem {
  to: string;
  label: string;
  allowedRoles: string[]; // lowercase roles allowed to see this item, or '*' for everyone
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", allowedRoles: ["*"] },
  { to: "/orders", label: "Orders", allowedRoles: ["*"] },
  { to: "/leads", label: "Leads", allowedRoles: ["superadmin", "admin", "orgadmin", "sales executive", "sales"] },
  { to: "/users", label: "Users", allowedRoles: ["superadmin", "admin"] },
  { to: "/roles", label: "Roles", allowedRoles: ["superadmin", "admin"] },
];

export function SideNav() {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();

  const filteredItems = NAV_ITEMS.filter(item => {
    if (item.allowedRoles.includes("*")) return true;
    return item.allowedRoles.map(r => r.toLowerCase()).includes(userRole);
  });

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] border-r border-wireframe-border bg-surface p-4">
      <div className="mb-6 text-lg font-semibold">CMD</div>
      <nav className="flex flex-col gap-2">
        {filteredItems.map(item => (
          <Link 
            key={item.to} 
            to={item.to} 
            className="px-3 py-2 rounded hover:bg-wireframe-bg-alt"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
