export type ApplicationStatus =
  | "BOOKMARKED"
  | "APPLYING"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"

export type RoleType =
  | "GRADUATE_PROGRAM"
  | "INTERNSHIP"
  | "PART_TIME"
  | "CASUAL"
  | "CONTRACT"
  | "FULL_TIME"

export type JobSource =
  | "MANUAL"
  | "AI_SEARCH"
  | "BROWSER_EXTENSION"
  | "SEEK"
  | "LINKEDIN"
  | "PROSPLE"
  | "GRAD_AUSTRALIA"
  | "GRAD_CONNECTION"
  | "OTHER"

export interface JobApplication {
  id: string
  userId: string
  company: string
  roleTitle: string
  location: string | null
  salary: string | null
  jobUrl: string | null
  source: JobSource
  industry: string | null
  roleType: RoleType
  description: string | null
  status: ApplicationStatus
  applicationDeadline: string | null
  appliedAt: string | null
  notes: string | null
  aiTips: string | null
  savedFromSearch: string | null
  createdAt: string
  updatedAt: string
}

export interface JobSearchResult {
  company: string
  roleTitle: string
  location: string
  roleType: RoleType
  industry: string
  deadline: string | null
  jobUrl: string
  source: string
  salary: string | null
  description: string
}

export const STATUS_COLUMNS: ApplicationStatus[] = [
  "BOOKMARKED",
  "APPLYING",
  "APPLIED",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  BOOKMARKED: "Bookmarked",
  APPLYING: "Applying",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
}

export const ROLE_TYPE_LABELS: Record<RoleType, string> = {
  GRADUATE_PROGRAM: "Graduate Program",
  INTERNSHIP: "Internship",
  PART_TIME: "Part Time",
  CASUAL: "Casual",
  CONTRACT: "Contract",
  FULL_TIME: "Full Time",
}

export const SOURCE_LABELS: Record<JobSource, string> = {
  MANUAL: "Manual",
  AI_SEARCH: "AI Search",
  BROWSER_EXTENSION: "Extension",
  SEEK: "Seek",
  LINKEDIN: "LinkedIn",
  PROSPLE: "Prosple",
  GRAD_AUSTRALIA: "GradAustralia",
  GRAD_CONNECTION: "GradConnection",
  OTHER: "Other",
}
