"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { isOverdue, isDueSoon } from "@/lib/utils"

interface CountdownBadgeProps {
  dueAt: string
}

function getCountdown(dueAt: string): string {
  const diff = new Date(dueAt).getTime() - Date.now()
  if (diff <= 0) return "Overdue"
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h < 24) return `Due in ${h}h ${m}m`
  const d = Math.floor(h / 24)
  return `Due in ${d}d ${h % 24}h`
}

export function CountdownBadge({ dueAt }: CountdownBadgeProps) {
  const [label, setLabel] = useState(getCountdown(dueAt))

  useEffect(() => {
    const timer = setInterval(() => setLabel(getCountdown(dueAt)), 60000)
    return () => clearInterval(timer)
  }, [dueAt])

  const overdue = isOverdue(dueAt)
  const soon = isDueSoon(dueAt, 2)

  return (
    <Badge
      variant={overdue ? "destructive" : soon ? "secondary" : "outline"}
      className={`text-xs ${soon && !overdue ? "border-amber-400 text-amber-700 bg-amber-50" : ""}`}
    >
      {label}
    </Badge>
  )
}
