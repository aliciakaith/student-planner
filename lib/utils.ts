import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format, isPast, isWithinInterval, addDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDeadline(date: Date | string): string {
  const d = new Date(date)
  return format(d, "MMM d, yyyy 'at' h:mm a")
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(date: Date | string): boolean {
  return isPast(new Date(date))
}

export function isDueSoon(date: Date | string, days = 3): boolean {
  const d = new Date(date)
  return isWithinInterval(d, { start: new Date(), end: addDays(new Date(), days) })
}

export function urgencyColor(date: Date | string): string {
  if (isOverdue(date)) return "text-red-600"
  if (isDueSoon(date, 1)) return "text-red-500"
  if (isDueSoon(date, 3)) return "text-amber-500"
  return "text-muted-foreground"
}

export function urgencyBadge(date: Date | string): "destructive" | "secondary" | "outline" {
  if (isOverdue(date)) return "destructive"
  if (isDueSoon(date, 3)) return "secondary"
  return "outline"
}
