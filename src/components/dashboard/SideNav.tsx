import { Link, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface NavItem {
  to: string;
  label: string;
  allowedRoles: string[]; // lowercase roles allowed to see this item, or '*' for everyone
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", allowedRoles: ["*"] },
  { to: "/orders", label: "Orders", allowedRoles: ["*"] },
  { to: "/customers", label: "Customers", allowedRoles: ["*"] },
  { to: "/leads", label: "Leads", allowedRoles: ["superadmin", "super_admin", "admin", "orgadmin", "sales executive", "sales"] },
  { to: "/users", label: "Users", allowedRoles: ["superadmin", "super_admin", "admin"] },
  { to: "/roles", label: "Roles", allowedRoles: ["superadmin", "super_admin", "admin"] },
  { to: "/firms", label: "Firms", allowedRoles: ["superadmin", "super_admin", "admin"] },
  { to: "/reports", label: "Reports", allowedRoles: ["*"] },
  { to: "/masters", label: "Master Settings", allowedRoles: ["superadmin", "super_admin", "admin", "md", "managingdirector"] },
];

import { formatRole } from './ProfileModal';

export function SideNav({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const userRole = (user?.role || '').toLowerCase().replace(/[\s_-]/g, '');

  const isLogistics = userRole === "logistics" || userRole === "logisticsteam";
  const { data: sidebarOrdersRes } = useQuery({
    queryKey: ["sidebar-orders"],
    queryFn: async () => {
      const res = await api.get("/orders");
      return res.data?.data || [];
    },
    enabled: isLogistics
  });

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
        {isLogistics && (
          <div className="mt-6 pt-4 border-t border-wireframe-border">
            <div className="flex items-center justify-between mb-3 px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>My Today's Work</span>
              <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-[10px] font-bold">
                {sidebarOrdersRes?.filter((o: any) => ["APPROVED", "LOGISTICS_PENDING", "FREIGHT_APPROVAL_PENDING", "DISPATCH_READY", "PACKED", "SHIPPED"].includes(o.status)).length || 0}
              </span>
            </div>
            <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto pr-1">
              {sidebarOrdersRes?.filter((o: any) => ["APPROVED", "LOGISTICS_PENDING", "FREIGHT_APPROVAL_PENDING", "DISPATCH_READY", "PACKED", "SHIPPED"].includes(o.status)).length === 0 ? (
                <span className="text-xs text-muted-foreground italic px-2">No pending tasks</span>
              ) : (
                sidebarOrdersRes
                  ?.filter((o: any) => ["APPROVED", "LOGISTICS_PENDING", "FREIGHT_APPROVAL_PENDING", "DISPATCH_READY", "PACKED", "SHIPPED"].includes(o.status))
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 5)
                  .map((o: any) => {
                    const isUnread = user && o.viewedBy && !o.viewedBy.some((id: any) => id.toString() === ((user as any)._id || user.id || "").toString());
                    return (
                      <Link
                        key={o._id}
                        to={`/orders/${o._id}` as any}
                        className="flex items-center justify-between p-2 rounded hover:bg-wireframe-bg-alt text-xs font-medium"
                      >
                        <div className="truncate flex items-center gap-1.5 mr-1">
                          <span className="font-bold text-foreground">{o.orderNumber}</span>
                          {isUnread && (
                            <span className="h-1.5 w-1.5 bg-red-500 rounded-full inline-block" title="New Assignment"></span>
                          )}
                        </div>
                        <span className="text-[9px] text-muted-foreground bg-wireframe-border/50 px-1 py-0.5 rounded uppercase font-semibold">
                          {o.status === "LOGISTICS_PENDING" ? "PLAN" : o.status === "DISPATCH_READY" ? "READY" : o.status === "SHIPPED" ? "SHIP" : o.status}
                        </span>
                      </Link>
                    );
                  })
              )}
            </div>
          </div>
        )}
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
