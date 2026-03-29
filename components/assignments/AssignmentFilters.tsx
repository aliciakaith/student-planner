"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CanvasCourse } from "@/types/canvas"

export type StatusFilter = "all" | "pending" | "submitted" | "overdue"
export type DateFilter = "all" | "week" | "fortnight" | "month"

interface AssignmentFiltersProps {
  courses: CanvasCourse[]
  selectedCourse: string
  status: StatusFilter
  dateRange: DateFilter
  onCourseChange: (v: string) => void
  onStatusChange: (v: StatusFilter) => void
  onDateRangeChange: (v: DateFilter) => void
}

export function AssignmentFilters({
  courses,
  selectedCourse,
  status,
  dateRange,
  onCourseChange,
  onStatusChange,
  onDateRangeChange,
}: AssignmentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Select value={selectedCourse} onValueChange={onCourseChange}>
        <SelectTrigger className="w-48 h-8 text-xs">
          <SelectValue placeholder="All courses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All courses</SelectItem>
          {courses.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => onStatusChange(v as StatusFilter)}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="submitted">Submitted</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
        </SelectContent>
      </Select>

      <Select value={dateRange} onValueChange={(v) => onDateRangeChange(v as DateFilter)}>
        <SelectTrigger className="w-36 h-8 text-xs">
          <SelectValue placeholder="Date range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All dates</SelectItem>
          <SelectItem value="week">Next 7 days</SelectItem>
          <SelectItem value="fortnight">Next 14 days</SelectItem>
          <SelectItem value="month">Next 30 days</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
