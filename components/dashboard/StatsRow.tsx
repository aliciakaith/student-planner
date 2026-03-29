import { BookOpen, Briefcase, AlertTriangle, Trophy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface StatsRowProps {
  totalAssignments: number
  overdueCount: number
  activeApplications: number
  offersCount: number
}

export function StatsRow({ totalAssignments, overdueCount, activeApplications, offersCount }: StatsRowProps) {
  const stats = [
    {
      label: "Assignments due",
      value: totalAssignments,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Overdue",
      value: overdueCount,
      icon: AlertTriangle,
      color: overdueCount > 0 ? "text-red-600" : "text-muted-foreground",
      bg: overdueCount > 0 ? "bg-red-50" : "bg-muted",
    },
    {
      label: "Active applications",
      value: activeApplications,
      icon: Briefcase,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Offers",
      value: offersCount,
      icon: Trophy,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
