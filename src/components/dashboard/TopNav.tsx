import { useAuth } from "@/lib/auth";
import { formatRole } from "./ProfileModal";

export function TopNav({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { user } = useAuth();
  
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
    <header className="h-16 bg-surface border-b border-wireframe-border flex items-center justify-between px-gutter sticky top-0 z-10">
      <div className="flex items-center gap-2 text-secondary">
        <span className="font-label-md text-label-md">Home</span>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-label-md text-label-md text-on-surface font-semibold">
          {formatRole(user?.role || '')} Dashboard
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search orders, customers…"
            className="w-72 pl-10 pr-3 py-2 bg-wireframe-bg-alt border border-wireframe-border rounded font-body-md text-body-md focus:outline-none focus:border-primary"
          />
        </div>
        <button className="relative p-2 rounded hover:bg-wireframe-bg-alt">
          <span className="material-symbols-outlined text-secondary">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>
        <button className="p-2 rounded hover:bg-wireframe-bg-alt">
          <span className="material-symbols-outlined text-secondary">help</span>
        </button>
        <div 
          className="flex items-center gap-2 cursor-pointer hover:bg-wireframe-bg-alt p-1 rounded transition-colors"
          onClick={onOpenProfile}
          title="View Profile"
        >
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-on-surface leading-none">{user?.firstName || user?.name || 'User'}</p>
            <p className="text-[10px] text-outline font-medium">{formatRole(user?.role || '')}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-[12px] uppercase text-white shadow-sm">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}