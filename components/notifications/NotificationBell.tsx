"use client"

import { Bell } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatRelative } from "@/lib/utils"

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications()

  return (
    <DropdownMenu onOpenChange={(open) => { if (open && unreadCount > 0) markAllRead() }}>
      <DropdownMenuTrigger
        nativeButton={false}
        render={<button className="relative outline-none p-1.5 rounded-lg hover:bg-muted transition-colors" />}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-semibold">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 8).map((n) => (
            <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 px-3 py-2.5">
              <div className="flex items-start justify-between w-full gap-2">
                <p className={`text-sm leading-snug ${!n.read ? "font-medium" : ""}`}>{n.title}</p>
                {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
              <p className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
