// Canvas LMS API client — all calls are proxied through /api/canvas/[...path]
// to avoid CORS and to keep the decrypted token server-side only.

export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  enrollment_term_id: number
  workflow_state: string
}

export interface CanvasAssignment {
  id: number
  course_id: number
  name: string
  description: string | null
  due_at: string | null
  points_possible: number | null
  submission_types: string[]
  html_url: string
  workflow_state: string
  has_submitted_submissions: boolean
}

export interface CanvasEvent {
  id: string
  title: string
  start_at: string
  end_at: string | null
  description: string | null
  location_name: string | null
  context_code: string
  html_url: string
}

// Client-side fetch wrapper — hits our internal proxy
export async function canvasFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api/canvas/${path}`)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error ?? `Canvas API error: ${res.status}`)
  }
  return res.json() as Promise<T>
}
