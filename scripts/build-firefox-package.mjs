import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const chromeDist = resolve(repoRoot, 'dist')
const firefoxDist = resolve(repoRoot, 'dist-firefox')
const firefoxZip = resolve(repoRoot, 'readtrace-firefox.zip')

await rm(firefoxDist, { recursive: true, force: true })
await rm(firefoxZip, { force: true })
await mkdir(firefoxDist, { recursive: true })
await cp(chromeDist, firefoxDist, { recursive: true })

const manifestPath = resolve(firefoxDist, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

manifest.background = {
  scripts: ['assets/background.js'],
  type: 'module',
}
manifest.browser_specific_settings = {
  gecko: {
    id: 'readtrace@daliuchen.github.io',
    strict_min_version: '121.0',
  },
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

await execFileAsync('zip', ['-r', firefoxZip, '.'], {
  cwd: firefoxDist,
})

console.log(`Created ${firefoxZip}`)
