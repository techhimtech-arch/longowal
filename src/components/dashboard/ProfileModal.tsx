import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function formatRole(role: string): string {
  const r = role.toLowerCase();
  if (r === 'superadmin' || r === 'admin') return 'Super Admin';
  if (r === 'orgadmin' || r === 'sales executive' || r === 'sales') return 'Sales Executive';
  if (r === 'logisticsteam' || r === 'logistics') return 'Logistics Team';
  if (r === 'volunteer' || r === 'operations') return 'Operations';
  if (r === 'citizen' || r === 'accounts' || r === 'accountant') return 'Accounts';
  return role || 'User';
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "US";

  const fullName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.name || "Enterprise User";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border border-wireframe-border rounded-lg shadow-xl p-6">
        <DialogHeader className="flex flex-col items-center pb-4 border-b border-wireframe-border">
          <div className="w-20 h-20 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-xl uppercase mb-3 text-white shadow-sm">
            {initials}
          </div>
          <DialogTitle className="text-xl font-bold text-on-surface">{fullName}</DialogTitle>
          <span className="mt-1 px-3 py-1 text-xs font-semibold bg-primary/10 text-primary rounded-full">
            {formatRole(user.role || '')}
          </span>
        </DialogHeader>

        <div className="py-4 space-y-4 font-body-md text-body-md">
          <div className="flex justify-between items-center py-2 border-b border-wireframe-bg-alt">
            <span className="text-secondary font-medium">Email Address</span>
            <span className="text-on-surface font-semibold truncate max-w-[240px]">{user.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-wireframe-bg-alt">
            <span className="text-secondary font-medium">User Role Type</span>
            <span className="text-on-surface font-semibold">{user.role || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-wireframe-bg-alt">
            <span className="text-secondary font-medium">Account Status</span>
            <span className="flex items-center gap-1.5 text-status-success font-semibold">
              <span className="w-2 h-2 rounded-full bg-status-success inline-block"></span>
              Active
            </span>
          </div>
          {user.schoolId && (
            <div className="flex justify-between items-center py-2 border-b border-wireframe-bg-alt">
              <span className="text-secondary font-medium">Organization ID</span>
              <span className="text-on-surface font-semibold select-all font-mono text-xs">{user.schoolId}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-primary text-on-primary rounded font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
