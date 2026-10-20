import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

type Ctx = { params: Promise<{ id: string }> }

const UPLOAD_DIR = path.join(process.cwd(), '..', 'uploads', 'recordings')
const MAX_SIZE = 25 * 1024 * 1024 // 25MB

// POST /api/cases/[id]/recording — multipart upload of an audio recording
export async function POST(req: Request, { params }: Ctx) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'LICENSE_AGENT') {
    return NextResponse.json({ error: 'Only LAs can upload recordings' }, { status: 403 })
  }
  const { id } = await params

  const c = await db.case.findUnique({ where: { id } })
  if (!c) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 })
  }
  if (c.licenseAgentId !== user.id) {
    return NextResponse.json({ error: 'Not assigned to you' }, { status: 403 })
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 413 })
  }

  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'bin'
  const filename = `${id}-${Date.now()}.${safeExt}`
  const filepath = path.join(UPLOAD_DIR, filename)
  const buf = Buffer.from(await file.arrayBuffer())
  await writeFile(filepath, buf)

  // Store relative path used by /api/recordings/[filename]
  const recordingUrl = `/api/recordings/${filename}`
  const updated = await db.case.update({
    where: { id },
    data: { recordingUrl },
  })

  await db.auditLog.create({
    data: {
      caseId: id,
      actorId: user.id,
      action: 'RECORDING_UPLOAD',
      details: `Recording uploaded: ${file.name} (${file.size} bytes)`,
    },
  })

  return NextResponse.json({ case: updated, recordingUrl })
}
