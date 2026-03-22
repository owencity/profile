import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const repoRoot = process.cwd()
const publicDir = path.join(repoRoot, 'public')

const sourcePath = path.join(publicDir, 'brand.png')
const out192 = path.join(publicDir, 'pwa-192.png')
const out512 = path.join(publicDir, 'pwa-512.png')

async function main() {
  await fs.access(sourcePath)

  const base = sharp(sourcePath).png()

  await Promise.all([
    base.clone().resize(192, 192, { fit: 'cover' }).toFile(out192),
    base.clone().resize(512, 512, { fit: 'cover' }).toFile(out512),
  ])
}

main().catch((err) => {
  console.error('[generate-pwa-icons] failed:', err)
  process.exitCode = 1
})

