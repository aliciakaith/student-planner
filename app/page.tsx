import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100 p-8">
      <main className="flex flex-col items-center gap-8 text-center max-w-2xl">
        <div className="space-y-2">
          <h1 className="text-5xl font-bold tracking-tight">UniTrack</h1>
          <p className="text-muted-foreground text-lg">Final Year Planner</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">Canvas LMS Integration</Badge>
          <Badge variant="secondary">AI Study Summaries</Badge>
          <Badge variant="secondary">Graduate Job Tracker</Badge>
        </div>

        <p className="text-muted-foreground max-w-md">
          Manage assignments, deadlines, and your entire grad job application pipeline —
          all in one place. Powered by AI.
        </p>

        <div className="flex gap-4">
          <Button size="lg" nativeButton={false} render={<Link href="/signup" />}>
            Get started
          </Button>
          <Button variant="outline" size="lg" nativeButton={false} render={<Link href="/login" />}>
            Sign in
          </Button>
        </div>
      </main>
    </div>
  )
}
