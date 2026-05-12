'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tick01Icon, ArrowRight01Icon, PlusSignIcon } from 'hugeicons-react'
import { saveTechPreferences, addCustomTech } from '@/lib/actions'

type Tech = {
  id: string
  name: string
  slug: string
  description: string | null
  category: string | null
}

export function TechSelector({
  userId,
  allTechs,
  initialSelectedIds,
}: {
  userId: string
  allTechs: Tech[]
  initialSelectedIds: string[]
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialSelectedIds))
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [addError, setAddError] = useState('')
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
    setSaving(true)
    await saveTechPreferences(userId, Array.from(selectedIds))
    setSaving(false)
    router.push('/dashboard')
  }

  const handleAddCustom = async () => {
    setAddError('')
    if (!customName.trim()) {
      setAddError('Name is required')
      return
    }
    if (!customUrl.trim()) {
      setAddError('GitHub URL is required')
      return
    }
    if (!customUrl.trim().includes('github.com')) {
      setAddError('Enter a valid GitHub repo URL')
      return
    }

    setAdding(true)
    await addCustomTech(userId, customName, customUrl)
    setCustomName('')
    setCustomUrl('')
    setAdding(false)
  }

  const categories = Array.from(
    new Set(allTechs.map((t) => t.category).filter(Boolean)),
  ) as string[]

  return (
    <>
      <div className="space-y-16">
        {categories.map((category, catIndex) => {
          const catTechs = allTechs.filter((t) => t.category === category)
          if (catTechs.length === 0) return null

          return (
            <section
              key={category}
              className="animate-fade-up"
              style={{ animationDelay: `${catIndex * 0.1}s` }}
            >
              <h2 className="font-mono text-xs text-fade tracking-[0.2em] uppercase mb-4">
                {category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {catTechs.map((tech) => {
                  const isSelected = selectedIds.has(tech.id)
                  return (
                    <button
                      key={tech.id}
                      onClick={() => toggle(tech.id)}
                      className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                        isSelected
                          ? 'border-amber bg-amber-dim ring-1 ring-amber/20'
                          : 'border-line bg-shade hover:border-ruling hover:bg-lift'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-ink truncate">{tech.name}</p>
                          {tech.description && (
                            <p className="text-xs text-fade mt-0.5 line-clamp-2">
                              {tech.description}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border transition-colors ${
                            isSelected
                              ? 'bg-amber border-amber text-void'
                              : 'border-ruling text-transparent'
                          }`}
                        >
                          <Tick01Icon className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className="mt-16 pt-8 border-t border-line animate-fade-up stagger-1">
        <h2 className="font-mono text-xs text-fade tracking-[0.2em] uppercase mb-4">Custom</h2>
        <p className="text-sm text-dust mb-4">
          Don&apos;t see your stack? Add any GitHub repository below.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Framework name (e.g. Svelte)"
            className="flex-1 rounded-lg border border-line bg-shade px-3.5 py-2.5 text-sm placeholder:text-fade"
          />
          <input
            type="text"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://github.com/user/repo"
            className="flex-1 rounded-lg border border-line bg-shade px-3.5 py-2.5 text-sm placeholder:text-fade font-mono"
          />
          <button
            onClick={handleAddCustom}
            disabled={adding}
            className="inline-flex items-center gap-1.5 rounded-lg bg-lift border border-ruling px-4 py-2.5 text-sm font-medium text-ink hover:bg-shade disabled:opacity-50 transition-colors shrink-0"
          >
            <PlusSignIcon className="w-4 h-4" />
            {adding ? 'Adding...' : 'Add'}
          </button>
        </div>
        {addError && <p className="mt-2 text-xs text-rose">{addError}</p>}
      </div>

      <div className="mt-12 pt-8 border-t border-line animate-fade-up stagger-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-amber px-6 py-3 text-sm font-semibold text-void hover:bg-amber/80 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Changes'}
          <ArrowRight01Icon className="w-4 h-4" />
        </button>
        <span className="ml-4 text-xs text-fade">
          {selectedIds.size} {selectedIds.size === 1 ? 'technology' : 'technologies'} selected
        </span>
      </div>
    </>
  )
}
