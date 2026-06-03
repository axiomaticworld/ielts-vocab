import refreshIcon from '../../../assets/icons/refresh.svg'
import { today } from '../../../composables/journal/page/journalPageUtils'
import { MicroLoading } from '../../ui'

/* ── Today Notes Actions (edit toggle + AI polish) ── */

interface TodayNotesActionsProps {
  editMode: boolean
  polishing: boolean
  onToggleEdit: () => void
  onPolish: () => void
}

const ROBOT_ICON_SVG = `<svg viewBox="0 0 1024 1024" width="18" height="18"><path d="M482.816 64a127.104 127.104 0 0 1 39.616 247.872l-0.128 43.776h106.368a272.96 272.96 0 0 1 256.064 178.56 39.552 39.552 0 0 1-74.24 27.392 193.92 193.92 0 0 0-181.888-126.784H336.896a193.856 193.856 0 0 0-193.856 193.792v58.432a193.856 193.856 0 0 0 193.92 193.856h291.712a39.552 39.552 0 1 1 0 79.04H336.896A272.96 272.96 0 0 1 64 686.912V628.48a272.96 272.96 0 0 1 272.96-272.768h106.304v-43.904A127.104 127.104 0 0 1 482.752 64h0.064z m323.392 593.728a16.192 16.192 0 0 1 13.376 13.376 140.16 140.16 0 0 0 104.512 114.24l12.16 2.432a16 16 0 0 1 0 31.808c-55.552 8.768-100.608 49.92-114.24 104.512l-2.432 12.16a16 16 0 0 1-31.808 0 140.16 140.16 0 0 0-104.576-114.24l-12.096-2.432a16 16 0 0 1 0-31.808 140.16 140.16 0 0 0 114.24-104.576l2.432-12.096a16 16 0 0 1 18.432-13.312zM336.96 570.304a58.368 58.368 0 1 1 3.84 116.736 58.368 58.368 0 0 1-3.84-116.736z m291.776 0a58.368 58.368 0 1 1 4.032 116.736 58.368 58.368 0 0 1-4.096-116.736z m-145.92-427.136a48 48 0 1 0-3.2 96 48 48 0 0 0 3.2-96z" fill="currentColor"/></svg>`

export function TodayNotesActions({
  editMode,
  polishing,
  onToggleEdit,
  onPolish,
}: TodayNotesActionsProps) {
  return (
    <div className="journal-today-actions">
      <button
        className="journal-edit-toggle-btn"
        title={editMode ? '退出编辑' : '编辑笔记'}
        aria-label={editMode ? '退出编辑' : '编辑笔记'}
        onClick={onToggleEdit}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          {editMode ? (
            <>
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </>
          ) : (
            <>
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </>
          )}
        </svg>
      </button>

      {editMode && (
        <button
          className="journal-polish-btn"
          disabled={polishing}
          onClick={onPolish}
          title="AI 润色"
          aria-label="AI 润色"
        >
          {polishing ? (
            <MicroLoading text="润色中..." />
          ) : (
            <span className="journal-polish-icon" dangerouslySetInnerHTML={{ __html: ROBOT_ICON_SVG }} />
          )}
        </button>
      )}
    </div>
  )
}

/* ── History Notes Actions (date filter + export) ── */

interface NotesActionsProps {
  startDate: string
  endDate: string
  exporting: boolean
  exportLabel: string
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onResetDates: () => void
  onExport: () => void
}

export function JournalNotesActions({
  startDate,
  endDate,
  exporting,
  exportLabel,
  onStartDateChange,
  onEndDateChange,
  onResetDates,
  onExport,
}: NotesActionsProps) {
  return (
    <div className="journal-filter-bar">
      <div className="journal-filter-group">
        <label className="journal-filter-label" htmlFor="journal-start-date">开始日期</label>
        <input
          id="journal-start-date"
          type="date"
          className="journal-date-input"
          value={startDate}
          max={endDate || today()}
          onChange={event => onStartDateChange(event.target.value)}
        />
      </div>
      <div className="journal-filter-group">
        <label className="journal-filter-label" htmlFor="journal-end-date">结束日期</label>
        <input
          id="journal-end-date"
          type="date"
          className="journal-date-input"
          value={endDate}
          max={today()}
          onChange={event => onEndDateChange(event.target.value)}
        />
      </div>
      <button
        className="journal-filter-reset"
        title="重置日期筛选"
        aria-label="重置日期筛选"
        onClick={onResetDates}
      >
        <img src={refreshIcon} alt="" aria-hidden="true" />
      </button>
      <div className="journal-export-group">
        <button
          className="journal-export-btn"
          disabled={exporting}
          onClick={onExport}
          title={exportLabel}
          aria-label={exportLabel}
        >
          {exporting ? (
            <MicroLoading text="导出中..." />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 3v11" />
              <path d="M8 10l4 4 4-4" />
              <path d="M5 19h14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
