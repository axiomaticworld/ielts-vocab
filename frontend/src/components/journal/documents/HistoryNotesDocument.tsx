import { Skeleton } from '../../ui'
import { renderJournalMarkdown } from '../../../lib/journalMarkdown'
import type { JournalEntry } from '../../../lib/schemas'

interface HistoryNotesDocumentProps {
  entries: JournalEntry[]
  loading: boolean
  error: string
  hasMore: boolean
  selectedEntry: JournalEntry | null
  onSelectEntry: (entry: JournalEntry) => void
  onLoadMore: () => void
  onBack: () => void
  formatDateTime: (iso: string) => string
}

function stripMarkdown(content: string, maxLen = 80): string {
  const text = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[.*?\]\(.*?\)/g, '[图片]')
    .replace(/\[([^\]]+)\]\(.*?\)/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}

function HistorySkeleton() {
  return (
    <div className="journal-history-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="journal-history-skeleton-card">
          <Skeleton width="28%" height={14} />
          <Skeleton width="100%" height={16} />
          <Skeleton width="100%" height={16} />
          <Skeleton width="64%" height={12} />
        </div>
      ))}
    </div>
  )
}

export default function HistoryNotesDocument({
  entries,
  loading,
  error,
  hasMore,
  selectedEntry,
  onSelectEntry,
  onLoadMore,
  onBack,
  formatDateTime,
}: HistoryNotesDocumentProps) {
  // Detail view for a single selected entry
  if (selectedEntry) {
    return (
      <div className="journal-doc-shell journal-doc-shell--history-detail">
        <button className="journal-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回列表
        </button>
        <article className="journal-doc-main journal-doc-main--history">
          <header className="journal-doc-hero">
            <span className="journal-doc-date-chip">{selectedEntry.date}</span>
            <h1 className="journal-doc-title">{selectedEntry.date} 笔记</h1>
            <div className="journal-doc-meta-row">
              <span>更新于 {formatDateTime(selectedEntry.updated_at)}</span>
            </div>
          </header>
          <div
            className="journal-doc-body markdown-content"
            dangerouslySetInnerHTML={{ __html: renderJournalMarkdown(selectedEntry.content) }}
          />
        </article>
      </div>
    )
  }

  // Card grid view
  return (
    <div className="journal-doc-shell journal-doc-shell--history">
      {loading ? (
        <HistorySkeleton />
      ) : error ? (
        <div className="journal-error">{error}</div>
      ) : entries.length === 0 ? (
        <div className="journal-empty journal-empty--main">
          <p>暂无历史笔记。</p>
          <p>在"今日笔记"中记录后，笔记会按日期出现在这里。</p>
        </div>
      ) : (
        <>
          <div className="journal-history-grid">
            {entries.map(entry => (
              <button
                key={entry.id}
                className="journal-history-card"
                onClick={() => onSelectEntry(entry)}
              >
                <span className="journal-history-card__date">{entry.date}</span>
                <p className="journal-history-card__preview">{stripMarkdown(entry.content)}</p>
                <span className="journal-history-card__time">
                  {formatDateTime(entry.updated_at)}
                </span>
              </button>
            ))}
          </div>

          {hasMore && (
            <div className="journal-history-more">
              <button
                className="journal-history-more-btn"
                onClick={onLoadMore}
                disabled={loading}
              >
                {loading ? '加载中...' : '加载更早笔记'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
