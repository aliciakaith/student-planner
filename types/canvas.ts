export interface CanvasCourse {
  id: number
  name: string
  course_code: string
  workflow_state: string
}

export interface CanvasSubmission {
  submitted_at: string | null
  workflow_state: "submitted" | "unsubmitted" | "graded" | "pending_review"
  score: number | null
  grade: string | null
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
  submission: CanvasSubmission | null
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

export interface CanvasTodoItem {
  assignment: CanvasAssignment
  context_name: string
  context_type: string
}
