import { useState, useRef, type DragEvent } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle } from 'lucide-react'
import { useImportLeads } from '../../hooks/useLeads'
import { useCampaigns } from '../../hooks/useCampaigns'
import { useToast } from '../../hooks/useToast'
import { Button } from '../ui/Button'
import styles from './ImportLeadsModal.module.scss'

const LEAD_FIELDS = [
  { value: '', label: '— skip —' },
  { value: 'linkedin_url', label: 'LinkedIn URL' },
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'company', label: 'Company' },
  { value: 'title', label: 'Title' },
] as const

// Auto-detect field from column name
function autoDetect(col: string): string {
  const lower = col.toLowerCase().replace(/[^a-z]/g, '')
  if (lower.includes('linkedin') || lower.includes('url') || lower.includes('profile')) return 'linkedin_url'
  if (lower.includes('firstname') || lower === 'first') return 'first_name'
  if (lower.includes('lastname') || lower === 'last') return 'last_name'
  if (lower.includes('company') || lower.includes('org')) return 'company'
  if (lower.includes('title') || lower.includes('role') || lower.includes('position')) return 'title'
  return ''
}

// Simple CSV parser (handles quoted commas)
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let current = ''
  let inQuotes = false
  let row: string[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(current.trim())
      if (row.some((c) => c)) rows.push(row)
      row = []
      current = ''
    } else {
      current += ch
    }
  }
  row.push(current.trim())
  if (row.some((c) => c)) rows.push(row)

  return rows
}

interface Props {
  onClose(): void
}

export function ImportLeadsModal({ onClose }: Props) {
  const importLeads = useImportLeads()
  const { data: campaigns = [] } = useCampaigns()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [campaignId, setCampaignId] = useState('')
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const parsed = parseCsv(text)
      if (parsed.length < 2) {
        toast.error('CSV must have a header row and at least one data row')
        return
      }

      const hdrs = parsed[0]
      const dataRows = parsed.slice(1)
      setHeaders(hdrs)
      setRows(dataRows)
      setFileName(file.name)

      // Auto-detect mappings
      const auto: Record<number, string> = {}
      hdrs.forEach((h, i) => {
        const detected = autoDetect(h)
        if (detected) auto[i] = detected
      })
      setMapping(auto)
      setStep(2)
    }
    reader.readAsText(file)
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleFileInput() {
    const file = fileInputRef.current?.files?.[0]
    if (file) handleFile(file)
  }

  function buildRows() {
    const urlIndex = Object.entries(mapping).find(([, v]) => v === 'linkedin_url')?.[0]
    if (urlIndex === undefined) return { valid: [], invalid: 0 }

    const valid: Array<Record<string, string>> = []
    let invalid = 0
    const urlPattern = /linkedin\.com\/in\//

    for (const row of rows) {
      const url = row[Number(urlIndex)] ?? ''
      if (!urlPattern.test(url)) {
        invalid++
        continue
      }

      const obj: Record<string, string> = { linkedin_url: url }
      for (const [colIdx, field] of Object.entries(mapping)) {
        if (field && field !== 'linkedin_url') {
          obj[field] = row[Number(colIdx)] ?? ''
        }
      }
      valid.push(obj)
    }

    return { valid, invalid }
  }

  async function handleImport() {
    const { valid } = buildRows()
    try {
      const res = await importLeads.mutateAsync({
        rows: valid as Array<{ linkedin_url: string; first_name?: string; last_name?: string; company?: string; title?: string }>,
        campaignId: campaignId || undefined,
      })
      setResult(res)
      setStep(4) // done
      toast.success(`Imported ${res.imported} leads`)
    } catch {
      toast.error('Import failed')
    }
  }

  const { valid, invalid } = step >= 3 ? buildRows() : { valid: [], invalid: 0 }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h2 className={styles.heading}>Import Leads</h2>

        {/* Step indicator */}
        <div className={styles.steps}>
          {[1, 2, 3].map((s, i) => (
            <span key={s}>
              <span
                className={`${styles.stepDot} ${step === s ? styles.active : ''} ${step > s ? styles.done : ''}`}
              >
                {step > s ? <CheckCircle size={14} /> : s}
              </span>
              {i < 2 && <span className={`${styles.stepLine} ${step > s ? styles.active : ''}`} />}
            </span>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <>
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dragOver : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={32} className={styles.dropIcon} />
              <div className={styles.dropText}>
                Drag & drop your CSV file here, or click to browse
              </div>
              <div className={styles.dropHint}>
                Expected: linkedin_url*, first_name, last_name, company, title
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileInput}
            />
          </>
        )}

        {/* Step 2: Map columns */}
        {step === 2 && (
          <>
            <div className={styles.fileInfo}>
              <FileText size={16} />
              {fileName}
              <span className={styles.fileRows}>{rows.length} rows</span>
            </div>

            <table className={styles.mappingTable}>
              <thead>
                <tr>
                  <th className={styles.mappingTh}>CSV Column</th>
                  <th className={styles.mappingTh}>Maps To</th>
                  <th className={styles.mappingTh}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((h, i) => (
                  <tr key={i}>
                    <td className={styles.mappingTd}>{h}</td>
                    <td className={styles.mappingTd}>
                      <select
                        className={styles.mappingSelect}
                        value={mapping[i] ?? ''}
                        onChange={(e) => setMapping({ ...mapping, [i]: e.target.value })}
                      >
                        {LEAD_FIELDS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className={styles.mappingTd}>
                      <span className={styles.previewValue}>
                        {rows[0]?.[i] ?? ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.footer}>
              <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!Object.values(mapping).includes('linkedin_url')}
              >
                Next
              </Button>
            </div>
          </>
        )}

        {/* Step 3: Confirm import */}
        {step === 3 && (
          <>
            <div className={styles.summary}>
              <span className={styles.summaryValue}>{valid.length}</span> valid rows
              {invalid > 0 && (
                <>, <span className={styles.summaryValue}>{invalid}</span> will be skipped (missing URL)</>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label className={styles.mappingTh} style={{ display: 'block', marginBottom: 8 }}>
                Assign to campaign (optional)
              </label>
              <select
                className={styles.mappingSelect}
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              >
                <option value="">No campaign</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {importLeads.isPending && (
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '60%' }} />
              </div>
            )}

            <div className={styles.footer}>
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button
                onClick={handleImport}
                disabled={importLeads.isPending || valid.length === 0}
              >
                {importLeads.isPending ? 'Importing...' : `Import ${valid.length} Leads`}
              </Button>
            </div>
          </>
        )}

        {/* Step 4: Done */}
        {step === 4 && result && (
          <>
            <div className={styles.summary}>
              Imported <span className={styles.summaryValue}>{result.imported}</span> leads.
              {result.skipped > 0 && (
                <> Skipped <span className={styles.summaryValue}>{result.skipped}</span> duplicates.</>
              )}
            </div>
            <div className={styles.footer}>
              <Button onClick={onClose}>Done</Button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
