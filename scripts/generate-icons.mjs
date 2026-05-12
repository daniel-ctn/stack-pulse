import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const svgPath = resolve(root, 'src/app/icon.svg')
const svg = readFileSync(svgPath)

const icoSizes = [16, 32, 48, 64]
const pngBuffers = await Promise.all(
  icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
)
const ico = await pngToIco(pngBuffers)

const targets = [resolve(root, 'public/favicon.ico'), resolve(root, 'src/app/favicon.ico')]
for (const t of targets) {
  mkdirSync(dirname(t), { recursive: true })
  writeFileSync(t, ico)
  console.log('wrote', t)
}

const ogPng = await sharp(svg).resize(512, 512).png().toBuffer()
const ogPath = resolve(root, 'public/logo.png')
writeFileSync(ogPath, ogPng)
console.log('wrote', ogPath)

const apple = await sharp(svg).resize(180, 180).png().toBuffer()
const applePath = resolve(root, 'src/app/apple-icon.png')
writeFileSync(applePath, apple)
console.log('wrote', applePath)
