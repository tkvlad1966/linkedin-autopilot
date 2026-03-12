import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, MoreHorizontal, Upload } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Lead, LeadStatus } from '@shared/types'
import { useLeads, useUpdateLead, useUpdateLeadsBulk } from '../hooks/useLeads'
import { useCampaigns } from '../hooks/useCampaigns'
import { useToast } from '../hooks/useToast'
import { useLeadsStore, hasActiveFilters, statusVariant } from '../store/leadsStore'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { LeadDetailPanel } from '../components/leads/LeadDetailPanel'
import { ImportLeadsModal } from '../components/leads/ImportLeadsModal'
import styles from './Leads.module.scss'

const ALL_STATUSES: LeadStatus[] = [
  'pending', 'visiting', 'connected', 'messaged', 'replied', 'not_interested', 'done',
]

export function Leads() {
  const filters = useLeadsStore((s) => s.activeFilters)
  const selectedIds = useLeadsStore((s) => s.selectedLeadIds)
  const { toggleSelect, selectAll, clearSelection, setFilter, clearFilters } = useLeadsStore()
  const { toast } = useToast()

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useLeads(filters)
  const { data: campaigns = [] } = useCampaigns()
  const updateLead = useUpdateLead()
  const updateBulk = useUpdateLeadsBulk()

  const [detailId, setDetailId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const allLeads = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  )
  const total = data?.pages[0]?.total ?? 0

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Search debounce
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>()
  function handleSearch(value: string) {
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      setFilter('search', value || undefined)
    }, 300)
  }

  function handleStatusFilter(status: LeadStatus) {
    const current = filters.status
    if (Array.isArray(current)) {
      const next = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
      setFilter('status', next.length ? next : undefined)
    } else if (current === status) {
      setFilter('status', undefined)
    } else {
      setFilter('status', current ? [current, status] : status)
    }
  }

  function isStatusActive(status: LeadStatus) {
    if (!filters.status) return false
    return Array.isArray(filters.status)
      ? filters.status.includes(status)
      : filters.status === status
  }

  const handleRowAction = useCallback(
    (lead: Lead, action: string) => {
      setOpenMenuId(null)
      switch (action) {
        case 'view':
          setDetailId(lead.id)
          break
        case 'skip':
          updateLead.mutate(
            { id: lead.id, status: 'not_interested' },
            { onSuccess: () => toast.success('Lead skipped') },
          )
          break
        case 'replied':
          updateLead.mutate(
            { id: lead.id, status: 'replied' },
            { onSuccess: () => toast.success('Marked as replied') },
          )
          break
        case 'remove':
          if (confirm('Remove this lead?')) {
            updateLead.mutate(
              { id: lead.id, status: 'done' },
              { onSuccess: () => toast.success('Lead removed') },
            )
          }
          break
      }
    },
    [updateLead, toast],
  )

  function handleBulkSkip() {
    updateBulk.mutate(
      { ids: [...selectedIds], updates: { status: 'not_interested' } },
      {
        onSuccess: () => {
          toast.success(`${selectedIds.size} leads skipped`)
          clearSelection()
        },
      },
    )
  }

  function handleSelectAll() {
    const ids = allLeads.map((l) => l.id)
    if (selectedIds.size === ids.length) {
      clearSelection()
    } else {
      selectAll(ids)
    }
  }

  function getInitials(lead: Lead) {
    const f = lead.first_name?.[0] ?? ''
    const l = lead.last_name?.[0] ?? ''
    return (f + l).toUpperCase() || '?'
  }

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Leads</h1>
        <span className={styles.totalChip}>{total} total</span>

        <div className={styles.headerRight}>
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search leads..."
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={() => setShowImport(true)}>
            <Upload size={14} />
            Import Leads
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filters.campaign_id ?? ''}
          onChange={(e) => setFilter('campaign_id', e.target.value || undefined)}
        >
          <option value="">All campaigns</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className={styles.statusPills}>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={`${styles.statusPill} ${isStatusActive(s) ? styles.active : ''}`}
              onClick={() => handleStatusFilter(s)}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {hasActiveFilters(filters) && (
          <button className={styles.clearFilters} onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <p>Loading leads...</p>
      ) : allLeads.length === 0 ? (
        <div className={styles.empty}>No leads found. Import some to get started.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th} style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={selectedIds.size === allLeads.length && allLeads.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Title</th>
                <th className={styles.th}>Company</th>
                <th className={styles.th}>Campaign</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Last Action</th>
                <th className={styles.th}>Tags</th>
                <th className={styles.th} style={{ width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {allLeads.map((lead) => {
                const campaign = campaigns.find((c) => c.id === lead.campaign_id)
                const lastAction = lead.messaged_at ?? lead.connected_at ?? lead.created_at

                return (
                  <tr
                    key={lead.id}
                    className={styles.tr}
                    onClick={() => setDetailId(lead.id)}
                  >
                    <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className={styles.checkbox}
                        checked={selectedIds.has(lead.id)}
                        onChange={() => toggleSelect(lead.id)}
                      />
                    </td>
                    <td className={styles.td}>
                      <div className={styles.nameCell}>
                        <div className={styles.avatar}>
                          {lead.avatar_url ? (
                            <img src={lead.avatar_url} alt="" />
                          ) : (
                            getInitials(lead)
                          )}
                        </div>
                        <span className={styles.name}>
                          {lead.first_name} {lead.last_name}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>{lead.title ?? '—'}</td>
                    <td className={styles.td}>{lead.company ?? '—'}</td>
                    <td className={styles.td}>{campaign?.name ?? '—'}</td>
                    <td className={styles.td}>
                      <Badge variant={statusVariant[lead.status]} size="sm">
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className={styles.td}>
                      {formatDistanceToNow(new Date(lastAction), { addSuffix: true })}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.tags}>
                        {lead.tags.slice(0, 2).map((t) => (
                          <span key={t} className={styles.tag}>{t}</span>
                        ))}
                        {lead.tags.length > 2 && (
                          <span className={styles.tagMore}>+{lead.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.td} onClick={(e) => e.stopPropagation()}>
                      <div style={{ position: 'relative' }} ref={openMenuId === lead.id ? menuRef : undefined}>
                        <button
                          className={styles.menuBtn}
                          onClick={() => setOpenMenuId(openMenuId === lead.id ? null : lead.id)}
                        >
                          <MoreHorizontal size={16} />
                        </button>
                        {openMenuId === lead.id && (
                          <div className={styles.menuDropdown}>
                            <button className={styles.menuItem} onClick={() => handleRowAction(lead, 'view')}>View</button>
                            <button className={styles.menuItem} onClick={() => handleRowAction(lead, 'skip')}>Skip</button>
                            <button className={styles.menuItem} onClick={() => handleRowAction(lead, 'replied')}>Mark replied</button>
                            <button className={`${styles.menuItem} ${styles.danger}`} onClick={() => handleRowAction(lead, 'remove')}>Remove</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Load more */}
      {hasNextPage && (
        <div className={styles.loadMore}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}

      {/* Bulk actions */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            className={styles.bulkBar}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <span className={styles.bulkCount}>{selectedIds.size} leads selected</span>
            <button className={styles.bulkClear} onClick={clearSelection}>Clear</button>
            <div className={styles.bulkActions}>
              <button className={styles.bulkBtn} onClick={handleBulkSkip}>Mark as Skipped</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail panel */}
      <AnimatePresence>
        {detailId && (
          <LeadDetailPanel leadId={detailId} onClose={() => setDetailId(null)} />
        )}
      </AnimatePresence>

      {/* Import modal */}
      {showImport && <ImportLeadsModal onClose={() => setShowImport(false)} />}
    </>
  )
}
