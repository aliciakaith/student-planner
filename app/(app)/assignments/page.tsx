"use client"

import { useState, useMemo } from "react"
import { RefreshCw, BookOpen, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useCanvas } from "@/hooks/useCanvas"
import { AssignmentCard } from "@/components/assignments/AssignmentCard"
import { AssignmentFilters, type StatusFilter, type DateFilter } from "@/components/assignments/AssignmentFilters"
import { isOverdue } from "@/lib/utils"
import { addDays } from "date-fns"

export default function AssignmentsPage() {
  const { courses, assignments, loading, error, refresh } = useCanvas()
  const [selectedCourse, setSelectedCourse] = useState("all")
  const [status, setStatus] = useState<StatusFilter>("all")
  const [dateRange, setDateRange] = useState<DateFilter>("all")
  const [markedDone, setMarkedDone] = useState<Set<number>>(new Set())
  const [refreshing, setRefreshing] = useState(false)

  function handleToggleDone(id: number) {
    setMarkedDone((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleRefresh() {
    setRefreshing(true)
    refresh()
    setTimeout(() => setRefreshing(false), 2000)
  }

  const filtered = useMemo(() => {
    let result = assignments

    if (selectedCourse !== "all") {
      result = result.filter((a) => String(a.course_id) === selectedCourse)
    }

    if (status === "pending") {
      result = result.filter(
        (a) => a.submission?.workflow_state !== "submitted" &&
          a.submission?.workflow_state !== "graded" &&
          !markedDone.has(a.id)
      )
    } else if (status === "submitted") {
      result = result.filter(
        (a) => a.submission?.workflow_state === "submitted" ||
          a.submission?.workflow_state === "graded" ||
          markedDone.has(a.id)
      )
    } else if (status === "overdue") {
      result = result.filter((a) => a.due_at && isOverdue(a.due_at))
    }

    if (dateRange !== "all") {
      const days = dateRange === "week" ? 7 : dateRange === "fortnight" ? 14 : 30
      const cutoff = addDays(new Date(), days)
      result = result.filter((a) => a.due_at && new Date(a.due_at) <= cutoff)
    }

    return result
  }, [assignments, selectedCourse, status, dateRange, markedDone])

  const courseMap = useMemo(
    () => new Map(courses.map((c) => [c.id, c])),
    [courses]
  )
  const courseIndexMap = useMemo(
    () => new Map(courses.map((c, i) => [c.id, i])),
    [courses]
  )

  const overdueCount = assignments.filter((a) => a.due_at && isOverdue(a.due_at)).length

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignments</h1>
          {!loading && assignments.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {assignments.length} total · {overdueCount > 0 ? (
                <span className="text-red-500">{overdueCount} overdue</span>
              ) : "none overdue"}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      {courses.length > 0 && (
        <AssignmentFilters
          courses={courses}
          selectedCourse={selectedCourse}
          status={status}
          dateRange={dateRange}
          onCourseChange={setSelectedCourse}
          onStatusChange={setStatus}
          onDateRangeChange={setDateRange}
        />
      )}

      {/* States */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <WifiOff className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">Couldn't load Canvas data</p>
          <p className="text-xs text-muted-foreground max-w-xs">{error}</p>
          <Button size="sm" onClick={handleRefresh}>Try again</Button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">No Canvas data yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Connect your Canvas account in Settings to see your assignments here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No assignments match the current filters
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              course={courseMap.get(a.course_id)}
              courseIndex={courseIndexMap.get(a.course_id) ?? 0}
              markedDone={markedDone.has(a.id)}
              onToggleDone={handleToggleDone}
            />
          ))}
        </div>
      )}
    </div>
  )
}
