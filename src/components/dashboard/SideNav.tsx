import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';

interface NavItem {
  to: string;
  label: string;
  allowedRoles: string[]; // lowercase roles allowed to see this item, or '*' for everyone
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", allowedRoles: ["*"] },
  { to: "/orders", label: "Orders", allowedRoles: ["*"] },
  { to: "/leads", label: "Leads", allowedRoles: ["superadmin", "super_admin", "admin", "orgadmin", "sales executive", "sales"] },
  { to: "/users", label: "Users", allowedRoles: ["superadmin", "super_admin", "admin"] },
  { to: "/roles", label: "Roles", allowedRoles: ["superadmin", "super_admin", "admin"] },
];

import { formatRole } from './ProfileModal';

export function SideNav({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = (user?.role || '').toLowerCase().replace(/[\s_-]/g, '');

  const filteredItems = NAV_ITEMS.filter(item => {
    if (item.allowedRoles.includes("*")) return true;
    return item.allowedRoles.map(r => r.toLowerCase().replace(/[\s_-]/g, '')).includes(userRole);
  });

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login", replace: true });
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.firstName && user?.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "US";

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] border-r border-wireframe-border bg-surface p-4 flex flex-col justify-between">
      <div>
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
      </div>

      <div className="pt-4 border-t border-wireframe-border space-y-3">
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-3 p-2 rounded hover:bg-wireframe-bg-alt cursor-pointer transition-colors"
          title="View Profile"
        >
          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-[12px] uppercase text-white shadow-sm">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-on-surface truncate">{user?.firstName || user?.name || 'User'}</p>
            <p className="text-xs text-outline truncate">{formatRole(user?.role || '')}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-left font-medium cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
