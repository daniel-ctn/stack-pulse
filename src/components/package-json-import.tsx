'use client'

import { useState } from 'react'
import { PlusSignIcon, Tick01Icon } from 'hugeicons-react'

import { addCustomTech, scanPackageJson } from '@/lib/actions'
import type { StackImportResult } from '@/lib/stack-import'
import { PulseLoader } from '@/components/ui/pulse-loader'

type Tech = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
}

type CandidateState = 'idle' | 'adding' | 'added' | 'error'

const MAX_CUSTOM_SHOWN = 8

export function PackageJsonImport({
  selectedIds,
  onSelectTechs,
  onCustomAdded,
}: {
  selectedIds: Set<string>
  onSelectTechs: (ids: string[]) => void
  onCustomAdded: (tech: Tech) => void
}) {
  const [text, setText] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<StackImportResult | null>(null)
  const [candidateStates, setCandidateStates] = useState<Record<string, CandidateState>>({})
  const [candidateErrors, setCandidateErrors] = useState<Record<string, string>>({})

  const handleScan = async () => {
    setError('')
    setResult(null)
    setCandidateStates({})
    setCandidateErrors({})
    setScanning(true)
    const scan = await scanPackageJson(text)
    setScanning(false)
    if (!scan.ok) {
      setError(scan.error)
      return
    }
    setResult(scan.data)
  }

  const handleAddCandidate = async (url: string, name: string) => {
    setCandidateStates((prev) => ({ ...prev, [url]: 'adding' }))
    const added = await addCustomTech(name, url)
    if (!added.ok) {
      setCandidateStates((prev) => ({ ...prev, [url]: 'error' }))
      setCandidateErrors((prev) => ({ ...prev, [url]: added.error }))
      return
    }
    setCandidateStates((prev) => ({ ...prev, [url]: 'added' }))
    onCustomAdded(added.data)
  }

  const unselectedMatchIds = result
    ? result.matched.map((match) => match.id).filter((id) => !selectedIds.has(id))
    : []

  return (
    <div className="frame overflow-hidden">
      <div className="frame-titlebar">
        <span className="win-dots">
          <span style={{ background: '#fb7185' }} />
          <span style={{ background: '#fbbf24' }} />
          <span style={{ background: '#34d399' }} />
        </span>
        <span className="text-dust">terminal — import package.json</span>
        <span className="ml-auto text-mute">fastest setup</span>
      </div>

      <div className="p-4 space-y-3 font-mono text-[12.5px]">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-fade">$</span>
          <span className="text-lime">stack import</span>
          <span className="text-dust">./package.json</span>
          <span className="text-fade">{'// paste your file, get your feed'}</span>
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={'{\n  "dependencies": { "next": "16.x", "react": "19.x", ... }\n}'}
          rows={5}
          spellCheck={false}
          className="w-full resize-y rounded-md border border-line bg-void px-3 py-2 text-[12px] leading-relaxed text-dust placeholder:text-fade"
        />

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleScan}
            disabled={scanning || text.trim().length === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-lime px-3 py-1.5 font-semibold text-void hover:bg-lime/85 disabled:opacity-60 transition-colors"
          >
            {scanning ? <PulseLoader size="inline" tone="dark" label="scanning…" /> : 'scan deps'}
          </button>
          {result && (
            <span className="text-fade text-[11.5px]">
              → scanned {result.scanned} packages: {result.matched.length} in registry,{' '}
              {result.custom.length} other repos
            </span>
          )}
        </div>

        {error && (
          <div className="text-rose text-[12px]">
            <span className="text-fade">→ </span>
            <span>error: {error}</span>
          </div>
        )}

        {result && result.matched.length > 0 && (
          <div className="space-y-2 border-t border-line pt-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-fade text-[11px] uppercase tracking-[0.2em]">
                registry matches
              </span>
              {unselectedMatchIds.length > 0 ? (
                <button
                  onClick={() => onSelectTechs(unselectedMatchIds)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-ruling bg-shade px-2.5 py-1 text-[11.5px] text-ink hover:border-lime hover:text-lime transition-colors"
                >
                  <PlusSignIcon className="w-3 h-3" />
                  select all {unselectedMatchIds.length}
                </button>
              ) : (
                <span className="text-lime text-[11.5px]">all selected ✓</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.matched.map((match) => {
                const isSelected = selectedIds.has(match.id)
                return (
                  <button
                    key={match.id}
                    onClick={() => onSelectTechs([match.id])}
                    disabled={isSelected}
                    title={match.packages.join(', ')}
                    className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11.5px] transition-colors ${
                      isSelected
                        ? 'border-lime/30 bg-lime/10 text-lime'
                        : 'border-ruling bg-void text-dust hover:border-edge hover:text-ink'
                    }`}
                  >
                    {isSelected && <Tick01Icon className="w-3 h-3" />}
                    {match.slug}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {result && result.custom.length > 0 && (
          <div className="space-y-2 border-t border-line pt-3">
            <span className="text-fade text-[11px] uppercase tracking-[0.2em]">
              other github repos — add as custom (max 5)
            </span>
            <ul className="space-y-1.5">
              {result.custom.slice(0, MAX_CUSTOM_SHOWN).map((candidate) => {
                const state = candidateStates[candidate.url] ?? 'idle'
                return (
                  <li key={candidate.url} className="flex items-center gap-2 text-[12px]">
                    {state === 'added' ? (
                      <span className="inline-flex w-14 justify-center text-lime">added</span>
                    ) : (
                      <button
                        onClick={() => handleAddCandidate(candidate.url, candidate.name)}
                        disabled={state === 'adding'}
                        className="inline-flex w-14 items-center justify-center gap-1 rounded-md border border-ruling bg-shade px-2 py-0.5 text-[11px] text-ink hover:border-lime hover:text-lime disabled:opacity-60 transition-colors"
                      >
                        {state === 'adding' ? <PulseLoader size="inline" label="" /> : '+ add'}
                      </button>
                    )}
                    <span className="truncate text-dust" title={candidate.packages.join(', ')}>
                      {candidate.url.replace('https://github.com/', '')}
                    </span>
                    <span className="text-fade text-[11px]">
                      ({candidate.packages.length} {candidate.packages.length === 1 ? 'pkg' : 'pkgs'}
                      )
                    </span>
                    {state === 'error' && (
                      <span className="truncate text-rose text-[11px]">
                        {candidateErrors[candidate.url]}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            {result.custom.length > MAX_CUSTOM_SHOWN && (
              <p className="text-fade text-[11px]">
                + {result.custom.length - MAX_CUSTOM_SHOWN} more repos not shown
              </p>
            )}
          </div>
        )}

        {result && result.unresolved.length > 0 && (
          <p className="text-fade text-[11px]">
            {'// '}
            {result.unresolved.length} packages had no github repo listed on npm
          </p>
        )}
      </div>
    </div>
  )
}
