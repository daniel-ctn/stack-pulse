'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tick01Icon, ArrowRight01Icon, PlusSignIcon, Search01Icon } from 'hugeicons-react'
import { saveTechPreferences, addCustomTech } from '@/lib/actions'
import { PackageJsonImport } from '@/components/package-json-import'
import { PulseLoader } from '@/components/ui/pulse-loader'

type Tech = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
}

export function TechSelector({
  allTechs,
  initialSelectedIds,
}: {
  allTechs: Tech[]
  initialSelectedIds: string[]
}) {
  const [techs, setTechs] = useState(allTechs)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [adding, setAdding] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [addError, setAddError] = useState('')
  const [query, setQuery] = useState('')
  const router = useRouter()

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSave = async () => {
    setSaveError('')
    setSaving(true)
    const result = await saveTechPreferences(Array.from(selectedIds))
    setSaving(false)
    if (!result.ok) {
      setSaveError(result.error)
      return
    }
    router.push('/dashboard')
  }

  const handleAddCustom = async () => {
    setAddError('')
    setAdding(true)
    const result = await addCustomTech(customName, customUrl)
    setAdding(false)
    if (!result.ok) {
      setAddError(result.error)
      return
    }
    setTechs((prev) =>
      prev.some((tech) => tech.id === result.data.id) ? prev : [...prev, result.data],
    )
    setSelectedIds((prev) => new Set(prev).add(result.data.id))
    setCustomName('')
    setCustomUrl('')
    router.refresh()
  }

  const handleImportSelect = (ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.add(id)
      return next
    })
  }

  const handleImportCustomAdded = (tech: Tech) => {
    setTechs((prev) => (prev.some((item) => item.id === tech.id) ? prev : [...prev, tech]))
    setSelectedIds((prev) => new Set(prev).add(tech.id))
    router.refresh()
  }

  const selectedTechs = useMemo(
    () => techs.filter((t) => selectedIds.has(t.id)),
    [techs, selectedIds],
  )

  const categories = useMemo(
    () => Array.from(new Set(techs.map((t) => t.category).filter(Boolean))) as string[],
    [techs],
  )

  const filteredTechs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return techs
    return techs.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    )
  }, [techs, query])

  return (
    <div className="space-y-10">
      {/* Live config preview */}
      <div className="frame overflow-hidden">
        <div className="frame-titlebar">
          <span className="win-dots">
            <span style={{ background: '#fb7185' }} />
            <span style={{ background: '#fbbf24' }} />
            <span style={{ background: '#34d399' }} />
          </span>
          <span className="text-dust">~/stack.config.ts</span>
          <span className="ml-auto text-mute">
            {selectedTechs.length} {selectedTechs.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <div className="px-4 py-4 font-mono text-[13px] leading-[1.7]">
          <div className="flex">
            <div className="gutter w-7 pr-3 shrink-0">
              {Array.from({ length: Math.max(selectedTechs.length, 1) + 3 }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              <div>
                <span className="text-magenta">export const</span>{' '}
                <span className="text-cyan">stack</span>
                <span className="text-dust"> = </span>
                <span className="text-dust">{'['}</span>
              </div>
              {selectedTechs.length === 0 ? (
                <div className="pl-4 text-fade">{'// empty — pick something below ↓'}</div>
              ) : (
                selectedTechs.map((tech, i) => (
                  <div key={tech.id} className="pl-4 group flex items-center gap-2">
                    <span className="text-cyan">&quot;{tech.slug}&quot;</span>
                    <span className="text-dust">,</span>
                    <button
                      onClick={() => toggle(tech.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-fade hover:text-rose text-[11px]"
                      title="remove"
                    >
                      [×]
                    </button>
                    {i === selectedTechs.length - 1 && (
                      <span className="ml-1 text-fade text-[11px]">{`// last`}</span>
                    )}
                  </div>
                ))
              )}
              <div>
                <span className="text-dust">{']'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import package.json */}
      <PackageJsonImport
        selectedIds={selectedIds}
        onSelectTechs={handleImportSelect}
        onCustomAdded={handleImportCustomAdded}
      />

      {/* Search bar */}
      <div>
        <div className="flex items-center gap-3 font-mono text-[11px] text-fade tracking-[0.2em] uppercase mb-3">
          <span className="text-lime">§</span>
          <span>registry</span>
          <span className="text-mute">/</span>
          <span>browse</span>
          <span className="ml-auto text-mute normal-case tracking-normal">
            {filteredTechs.length} packages
          </span>
        </div>
        <div className="relative">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fade" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="search packages..."
            className="w-full rounded-md border border-line bg-shade pl-10 pr-3 py-2.5 text-sm placeholder:text-fade"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fade hover:text-ink text-[11px] font-mono"
            >
              esc
            </button>
          )}
        </div>
      </div>

      {/* Categorized package grid */}
      <div className="space-y-10">
        {query ? (
          <CategorySection techs={filteredTechs} selectedIds={selectedIds} onToggle={toggle} />
        ) : (
          categories.map((category) => {
            const catTechs = techs.filter((t) => t.category === category)
            if (catTechs.length === 0) return null
            return (
              <section key={category} className="animate-fade-up">
                <div className="flex items-center gap-3 font-mono text-[11px] text-fade tracking-[0.2em] uppercase mb-4">
                  <span className="text-mute">└─</span>
                  <span>{category}</span>
                  <div className="h-px flex-1 bg-line" />
                  <span className="text-mute normal-case tracking-normal">{catTechs.length}</span>
                </div>
                <CategorySection techs={catTechs} selectedIds={selectedIds} onToggle={toggle} />
              </section>
            )
          })
        )}
      </div>

      {/* Custom add */}
      <div className="frame overflow-hidden">
        <div className="frame-titlebar">
          <span className="win-dots">
            <span style={{ background: '#fb7185' }} />
            <span style={{ background: '#fbbf24' }} />
            <span style={{ background: '#34d399' }} />
          </span>
          <span className="text-dust">terminal — add custom repo</span>
          <span className="ml-auto text-mute">github only</span>
        </div>
        <div className="p-4 space-y-3 font-mono text-[12.5px]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-fade">$</span>
            <span className="text-lime">stack add</span>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="<name>"
              className="flex-1 min-w-[120px] rounded-sm bg-void border border-line px-2 py-1 text-ink"
            />
            <span className="text-fade">--repo</span>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="github.com/owner/repo"
              className="flex-[2] min-w-[180px] rounded-sm bg-void border border-line px-2 py-1 text-cyan"
            />
            <button
              onClick={handleAddCustom}
              disabled={adding}
              className="inline-flex items-center gap-1.5 rounded-md bg-shade border border-ruling px-3 py-1.5 text-ink hover:border-lime hover:text-lime disabled:opacity-70 transition-colors"
            >
              {adding ? (
                <PulseLoader size="inline" label="adding…" />
              ) : (
                <>
                  <PlusSignIcon className="w-3.5 h-3.5" />
                  run
                </>
              )}
            </button>
          </div>
          {addError ? (
            <div className="text-rose text-[12px]">
              <span className="text-fade">→ </span>
              <span>error: {addError}</span>
            </div>
          ) : (
            <div className="text-fade text-[12px]">
              <span>→ </span>
              <span>{"don't see your stack? add any github repo."}</span>
            </div>
          )}
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-4 z-20">
        <div className="frame px-4 py-3 bg-shade/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 font-mono text-[12px]">
              <span className="text-fade">$</span>
              <span className="text-lime">stack commit</span>
              <span className="text-dust">--items</span>
              <span className="text-amber">{selectedIds.size}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-lime px-4 py-2 font-mono text-[12.5px] font-semibold text-void hover:bg-lime/85 disabled:opacity-80 transition-colors"
            >
              {saving ? (
                <PulseLoader size="inline" tone="dark" label="committing…" />
              ) : (
                <>
                  save &amp; continue
                  <ArrowRight01Icon className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
          {saveError && (
            <p className="mt-2 font-mono text-[11.5px] text-rose">
              <span className="text-fade">→ </span>
              error: {saveError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function CategorySection({
  techs,
  selectedIds,
  onToggle,
}: {
  techs: Tech[]
  selectedIds: Set<string>
  onToggle: (id: string) => void
}) {
  if (techs.length === 0) {
    return <div className="font-mono text-[12px] text-fade">→ no matches.</div>
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line rounded-md overflow-hidden">
      {techs.map((tech) => {
        const isSelected = selectedIds.has(tech.id)
        return (
          <button
            key={tech.id}
            onClick={() => onToggle(tech.id)}
            className={`group relative w-full text-left p-4 transition-colors ${
              isSelected ? 'bg-lime-dim hover:bg-lime/15' : 'bg-shade hover:bg-lift'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-mono text-[13px]">
                  <span className={isSelected ? 'text-lime' : 'text-fade'}>
                    {isSelected ? '+' : '○'}
                  </span>
                  <span className={`truncate ${isSelected ? 'text-lime' : 'text-ink'}`}>
                    {tech.slug}
                  </span>
                </div>
                {tech.description && (
                  <p className="text-[12px] text-fade mt-1 line-clamp-2 leading-snug">
                    {tech.description}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-[3px] border transition-colors ${
                  isSelected
                    ? 'bg-lime border-lime text-void'
                    : 'border-ruling text-transparent group-hover:border-edge'
                }`}
                aria-hidden
              >
                <Tick01Icon className="w-3 h-3" />
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
