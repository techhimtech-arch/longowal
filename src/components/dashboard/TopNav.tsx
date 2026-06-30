import { useAuth } from "@/lib/auth";
import { formatRole } from "./ProfileModal";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNavigate } from "@tanstack/react-router";

export function TopNav({ onOpenProfile }: { onOpenProfile: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Fetch notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      try {
        const res = await api.get("/notifications");
        return res.data?.data || [];
      } catch (e) {
        return [];
      }
    },
    refetchInterval: 15000, // Poll every 15s
    enabled: !!user
  });

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  // Mutations
  const readNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Invalidate orders queries too to refresh highlights
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    }
  });

  const readAllNotificationsMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/notifications/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order"] });
    }
  });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await readNotificationMutation.mutateAsync(notif._id);
    }
    setIsOpen(false);
    if (notif.orderId) {
      navigate({ to: `/orders/${notif.orderId}` });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "NEW_ORDER": return "shopping_bag";
      case "ORDER_APPROVED": return "check_circle";
      case "LOGISTICS_ASSIGNED": return "local_shipping";
      case "AWAITING_FREIGHT_APPROVAL": return "pending_actions";
      case "FREIGHT_APPROVED": return "thumb_up";
      case "FREIGHT_REJECTED": return "thumb_down";
      case "READY_TO_DISPATCH": return "send";
      case "DELIVERED": return "assignment_turned_in";
      case "SENT_TO_ACCOUNTS": return "account_balance";
      case "PAYMENT_COMPLETED": return "payments";
      default: return "notifications";
    }
  };

  return (
    <header className="h-16 bg-surface border-b border-wireframe-border flex items-center justify-between px-gutter sticky top-0 z-20">
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

        {/* Notifications Icon and Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 rounded hover:bg-wireframe-bg-alt transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-secondary">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white shadow-sm ring-1 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-[450px] overflow-hidden bg-surface border border-wireframe-border rounded-lg shadow-xl flex flex-col z-30 animate-fade-in">
              <div className="p-3 bg-wireframe-bg-alt border-b border-wireframe-border flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => readAllNotificationsMutation.mutate()}
                    className="text-xs text-primary hover:underline font-bold"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1 divide-y divide-wireframe-border max-h-[350px]">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    <span className="material-symbols-outlined text-[28px] text-outline mb-1.5">notifications_off</span>
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif: any) => (
                    <div 
                      key={notif._id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 flex items-start gap-2.5 cursor-pointer hover:bg-wireframe-bg-alt/30 transition-all ${
                        !notif.isRead ? 'bg-blue-50/40 border-l-2 border-primary' : ''
                      }`}
                    >
                      <div className={`p-1.5 rounded-full flex-shrink-0 ${
                        !notif.isRead ? 'bg-primary-container text-primary' : 'bg-wireframe-bg-alt text-secondary'
                      }`}>
                        <span className="material-symbols-outlined text-[16px] block">
                          {getNotificationIcon(notif.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs text-foreground truncate ${!notif.isRead ? 'font-bold' : 'font-medium'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-secondary mt-0.5 leading-snug line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-outline mt-1 block">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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