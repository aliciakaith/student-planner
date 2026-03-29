import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { applicationDeadline, appliedAt, ...rest } = body

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...rest,
      ...(applicationDeadline !== undefined && {
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
      }),
      ...(appliedAt !== undefined && {
        appliedAt: appliedAt ? new Date(appliedAt) : null,
      }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const existing = await prisma.jobApplication.findFirst({ where: { id, userId: user.id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.jobApplication.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
