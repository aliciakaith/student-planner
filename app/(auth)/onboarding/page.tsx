"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, ChevronRight, ChevronLeft } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

const UNIVERSITIES = [
  "University of Sydney",
  "UNSW Sydney",
  "University of Queensland",
  "Monash University",
  "University of Melbourne",
  "Australian National University",
  "University of Western Australia",
  "Other",
]

const WORK_RIGHTS = [
  { value: "CITIZEN", label: "Australian Citizen" },
  { value: "PERMANENT_RESIDENT", label: "Permanent Resident" },
  { value: "STUDENT_VISA", label: "Student Visa" },
  { value: "WORKING_VISA", label: "Working Visa" },
  { value: "OTHER", label: "Other" },
]

const WORK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const onboardingSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  university: z.string().min(1, "Please select your university"),
  degree: z.string().min(2, "Please enter your degree"),
  fieldOfStudy: z.string().min(2, "Please enter your field of study"),
  graduationYear: z.string().min(1, "Please select your graduation year"),
  workRights: z.string().min(1, "Please select your work rights"),
  canvasUrl: z.string().url("Must be a valid URL (e.g. https://canvas.sydney.edu.au)").optional().or(z.literal("")),
  canvasToken: z.string().optional(),
  worksPartTime: z.boolean().default(false),
  workDays: z.array(z.string()).default([]),
})

type OnboardingForm = z.infer<typeof onboardingSchema>

const STEPS = [
  { title: "About you", description: "Tell us a bit about yourself" },
  { title: "Your studies", description: "Your degree and graduation details" },
  { title: "Work rights", description: "Important for grad job matching" },
  { title: "Canvas LMS", description: "Connect your university Canvas (optional)" },
  { title: "Preferences", description: "Personalise your study schedule" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: { worksPartTime: false, workDays: [] },
  })

  const worksPartTime = watch("worksPartTime")
  const workDays = watch("workDays") ?? []

  function toggleWorkDay(day: string) {
    const current = workDays
    if (current.includes(day)) {
      setValue("workDays", current.filter((d) => d !== day))
    } else {
      setValue("workDays", [...current, day])
    }
  }

  async function onSubmit(data: OnboardingForm) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Session expired. Please sign in again.")
      router.push("/login")
      return
    }

    const res = await fetch("/api/auth/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        graduationYear: parseInt(data.graduationYear),
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Something went wrong" }))
      toast.error(err.error ?? "Failed to save profile")
      return
    }

    toast.success("Welcome to UniTrack!")
    router.push("/dashboard")
    router.refresh()
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">
            Step {step + 1} of {STEPS.length}
          </span>
          <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5 mb-4" />
        <CardTitle>{STEPS[step].title}</CardTitle>
        <CardDescription>{STEPS[step].description}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 0: About you */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" placeholder="Alex Smith" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>University</Label>
                <Select onValueChange={(v) => setValue("university", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your university" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIVERSITIES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.university && (
                  <p className="text-xs text-destructive">{errors.university.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Studies */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="degree">Degree name</Label>
                <Input
                  id="degree"
                  placeholder="Bachelor of Computer Science"
                  {...register("degree")}
                />
                {errors.degree && (
                  <p className="text-xs text-destructive">{errors.degree.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fieldOfStudy">Field of study</Label>
                <Input
                  id="fieldOfStudy"
                  placeholder="Computer Science"
                  {...register("fieldOfStudy")}
                />
                {errors.fieldOfStudy && (
                  <p className="text-xs text-destructive">{errors.fieldOfStudy.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Graduation year</Label>
                <Select onValueChange={(v) => setValue("graduationYear", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
                {errors.graduationYear && (
                  <p className="text-xs text-destructive">{errors.graduationYear.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Work rights */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Work rights in Australia</Label>
                <Select onValueChange={(v) => setValue("workRights", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work rights" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_RIGHTS.map((w) => (
                      <SelectItem key={w.value} value={w.value}>
                        {w.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workRights && (
                  <p className="text-xs text-destructive">{errors.workRights.message}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                This is used to filter graduate job opportunities relevant to your visa status.
              </p>
            </div>
          )}

          {/* Step 3: Canvas */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect Canvas to see your assignments and deadlines automatically. You can skip
                this and add it later in Settings.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="canvasUrl">Canvas URL</Label>
                <Input
                  id="canvasUrl"
                  placeholder="https://canvas.sydney.edu.au"
                  {...register("canvasUrl")}
                />
                {errors.canvasUrl && (
                  <p className="text-xs text-destructive">{errors.canvasUrl.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="canvasToken">Canvas personal API token</Label>
                <Input
                  id="canvasToken"
                  type="password"
                  placeholder="Paste your Canvas token here"
                  {...register("canvasToken")}
                />
                <p className="text-xs text-muted-foreground">
                  Generate at: Canvas → Account → Settings → New Access Token. Your token is
                  encrypted before being stored.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="worksPartTime"
                  className="h-4 w-4 rounded border-input"
                  checked={worksPartTime}
                  onChange={(e) => setValue("worksPartTime", e.target.checked)}
                />
                <Label htmlFor="worksPartTime" className="cursor-pointer">
                  I work part-time while studying
                </Label>
              </div>

              {worksPartTime && (
                <div className="space-y-2">
                  <Label>Which days do you work?</Label>
                  <div className="flex flex-wrap gap-2">
                    {WORK_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkDay(day)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          workDays.includes(day)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:border-primary"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                The AI weekly summary will account for your work days when suggesting study
                schedules.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="flex-1"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back
              </Button>
            )}

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="flex-1"
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finish setup
              </Button>
            )}
          </div>

          {step === 3 && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setStep((s) => s + 1)}
            >
              Skip Canvas for now
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
