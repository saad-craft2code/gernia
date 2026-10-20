import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), '..', 'uploads', 'recordings')

const EXT_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
  amr: 'audio/amr',
  bin: 'application/octet-stream',
}

type Ctx = { params: Promise<{ filename: string }> }

// GET /api/recordings/[filename] — serve a previously uploaded recording
export async function GET(_req: Request, { params }: Ctx) {
  const { filename } = await params
  // Sanitize: only allow filename (no path traversal)
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '')
  const filepath = path.join(UPLOAD_DIR, safe)
  if (!filepath.startsWith(UPLOAD_DIR) || !existsSync(filepath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const buf = await readFile(filepath)
  const ext = (safe.split('.').pop() || 'bin').toLowerCase()
  const mime = EXT_MIME[ext] || 'application/octet-stream'
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(buf.length),
      'Cache-Control': 'private, max-age=3600',
    },
  })
}
