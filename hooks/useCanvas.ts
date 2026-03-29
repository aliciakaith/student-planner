"use client"

import { useEffect, useState, useCallback } from "react"
import type { CanvasCourse, CanvasAssignment, CanvasEvent } from "@/types/canvas"

interface UseCanvasReturn {
  courses: CanvasCourse[]
  assignments: CanvasAssignment[]
  events: CanvasEvent[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useCanvas(): UseCanvasReturn {
  const [courses, setCourses] = useState<CanvasCourse[]>([])
  const [assignments, setAssignments] = useState<CanvasAssignment[]>([])
  const [events, setEvents] = useState<CanvasEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isRefresh, setIsRefresh] = useState(false)

  const refresh = useCallback(() => {
    setIsRefresh(true)
    setRefreshKey((k) => k + 1)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      const suffix = isRefresh ? "?refresh=1" : ""

      try {
        // Fetch courses first
        const coursesRes = await fetch(`/api/canvas/courses${suffix}`)
        if (!coursesRes.ok) {
          if (coursesRes.status === 400) {
            // Canvas not configured — not an error, just empty
            setLoading(false)
            return
          }
          throw new Error("Failed to fetch courses")
        }

        const coursesData: CanvasCourse[] = await coursesRes.json()
        const activeCourses = coursesData.filter((c) => c.workflow_state === "available")
        if (!cancelled) setCourses(activeCourses)

        // Fetch assignments for each course in parallel
        const assignmentResults = await Promise.allSettled(
          activeCourses.map((course) =>
            fetch(
              `/api/canvas/courses/${course.id}/assignments?per_page=50&include[]=submission${suffix}`
            ).then((r) => r.json() as Promise<CanvasAssignment[]>)
          )
        )

        const allAssignments = assignmentResults
          .filter((r): r is PromiseFulfilledResult<CanvasAssignment[]> => r.status === "fulfilled")
          .flatMap((r) => r.value)
          .filter((a) => a.due_at && a.workflow_state !== "deleted")
          .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())

        if (!cancelled) setAssignments(allAssignments)

        // Fetch upcoming events
        const eventsRes = await fetch(`/api/canvas/users/self/upcoming_events${suffix}`)
        if (eventsRes.ok) {
          const eventsData: CanvasEvent[] = await eventsRes.json()
          if (!cancelled) setEvents(eventsData)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load Canvas data")
      } finally {
        if (!cancelled) {
          setLoading(false)
          setIsRefresh(false)
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [refreshKey])

  return { courses, assignments, events, loading, error, refresh }
}
