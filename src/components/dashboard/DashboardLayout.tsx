import { useState, type ReactNode } from "react";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";
import { ProfileModal } from "./ProfileModal";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wireframe-bg-alt text-on-surface">
      <SideNav onOpenProfile={() => setIsProfileOpen(true)} />
      <main className="ml-[260px] min-h-screen flex flex-col">
        <TopNav onOpenProfile={() => setIsProfileOpen(true)} />
        {children}
      </main>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}