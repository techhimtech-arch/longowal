import type { ReactNode } from "react";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-wireframe-bg-alt text-on-surface">
      <SideNav />
      <main className="ml-[260px] min-h-screen flex flex-col">
        <TopNav />
        {children}
      </main>
    </div>
  );
}