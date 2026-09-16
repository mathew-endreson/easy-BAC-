import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { previewStreamConsolidation, runStreamConsolidation, LEGACY_STREAM_IDS, TARGET_STREAM_ID } from '../../services/migrations.js'

// One-time maintenance tools for Super Admin. Currently: consolidating the 3
// retired "genie-*" streams into the single canonical Technique Mathématique
// stream. Preview is read-only and safe to run any number of times; Run writes
// (remaps a field value — never deletes a document) and should only be run
// once confirmed via Preview.
export default function AdminMigrations({ showToast }) {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [lastRun, setLastRun] = useState(null)

  async function preview() {
    setLoading(true); setError('')
    try { setRows(await previewStreamConsolidation()) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function run() {
    const total = rows?.reduce((s, r) => s + r.count, 0) || 0
    if (!confirm(`Remap ${total} document field(s) from the 3 retired streams to "${TARGET_STREAM_ID}"? This only changes a field value — no documents are deleted.`)) return
    setRunning(true); setError('')
    try {
      const result = await runStreamConsolidation(user?.uid)
      setLastRun(result)
      showToast?.(`Migration complete — ${result.totalWrites} document(s) updated`)
      await preview()
    } catch (e) { setError(e.message) }
    finally { setRunning(false) }
  }

  const total = rows?.reduce((s, r) => s + r.count, 0) ?? null

  return (
    <section className="bg-surface p-10 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.05)] mb-[30px] fade-in-anim max-[850px]:p-5 max-[850px]:rounded-xl">
      <h2>Maintenance</h2>
      <p className="text-ink-muted text-sm mt-1 mb-6">One-time data tools. Currently: consolidate the retired Technical streams.</p>

      <div className="border border-border-soft rounded-xl p-5">
        <h3 className="text-base font-bold mb-2">Consolidate Technical streams</h3>
        <p className="text-ink-muted text-sm mb-4">
          Remaps any document still tagged with <code>{LEGACY_STREAM_IDS.join(', ')}</code> to the single
          canonical <code>{TARGET_STREAM_ID}</code> stream. Only remaps a field value — never deletes a document.
        </p>

        {error && <p className="text-primary-strong text-sm mb-3">{error}</p>}

        <div className="flex gap-2 mb-4">
          <button onClick={preview} disabled={loading} className="bg-surface-muted text-ink border-0 py-2.5 px-5 rounded-lg font-semibold cursor-pointer disabled:opacity-50">
            {loading ? 'Scanning…' : 'Preview'}
          </button>
          <button onClick={run} disabled={running || !rows || total === 0} className="bg-primary-strong text-white border-0 py-2.5 px-5 rounded-lg font-semibold cursor-pointer disabled:opacity-50">
            {running ? 'Running…' : 'Run Migration'}
          </button>
        </div>

        {rows && (
          <div className="flex flex-col gap-1.5">
            {rows.map((r) => (
              <div key={`${r.collection}.${r.field}`} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-surface-muted">
                <span className="text-ink-muted">{r.collection}.{r.field}</span>
                <span className={`font-bold ${r.count > 0 ? 'text-primary-strong' : 'text-emerald-600'}`}>{r.count}</span>
              </div>
            ))}
            <p className="text-xs text-ink-muted mt-2">
              {total === 0 ? 'All clear — nothing references a retired stream.' : `${total} document(s) still reference a retired stream.`}
            </p>
          </div>
        )}

        {lastRun && (
          <p className="text-xs text-emerald-600 mt-3">Last run updated {lastRun.totalWrites} document(s).</p>
        )}
      </div>
    </section>
  )
}
