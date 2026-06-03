import { useCallback, useEffect, useRef, useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { htmlToMarkdown } from '../../../lib/htmlToMarkdown'
import { renderJournalMarkdown } from '../../../lib/journalMarkdown'
import type { JournalEntry } from '../../../lib/schemas'

interface TodayNotesDocumentProps {
  entry: JournalEntry | null
  editMode: boolean
  polishing: boolean
  polishedPreview: string | null
  onSave: (content: string) => void
  onPolish: () => void
  onAcceptPolish: () => void
  onRejectPolish: () => void
  formatDateTime: (iso: string) => string
}

interface CtxMenuState { x: number; y: number; visible: boolean }

/* -- Image Gallery -- */

const MAX_JOURNAL_IMAGES = 3

interface ImageGalleryProps {
  images: string[]
  isReadOnly?: boolean
  onAddImage?: () => void
  onRemove: (idx: number) => void
}

function ImageGallery({ images, isReadOnly, onAddImage, onRemove }: ImageGalleryProps) {
  if (images.length === 0 && isReadOnly) return null

  return (
    <section
      className={`journal-image-panel ${isReadOnly ? 'journal-image-panel--readonly' : ''}`}
      aria-label="日记图片附件"
    >
      <div className="journal-image-panel__head">
        <span className="journal-image-panel__title">图片附件</span>
        <span className="journal-image-panel__count">{images.length}/{MAX_JOURNAL_IMAGES}</span>
      </div>
      <div className={`journal-image-card-grid ${isReadOnly ? 'journal-image-card-grid--readonly' : ''}`}>
        {images.map((src, i) => (
          <figure key={i} className="journal-image-card">
            <img src={src} alt={`附件 ${i + 1}`} />
            <figcaption>图片 {i + 1}</figcaption>
            {!isReadOnly && (
              <button className="journal-image-card__remove" title="移除图片" aria-label={`移除图片 ${i + 1}`} onClick={() => onRemove(i)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </figure>
        ))}
        {!isReadOnly && images.length < MAX_JOURNAL_IMAGES ? (
          <button className="journal-image-card journal-image-card--add" type="button" onClick={onAddImage}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
              <path d="M12 7v6" />
              <path d="M9 10h6" />
            </svg>
            <span>添加图片</span>
            <small>最多 {MAX_JOURNAL_IMAGES} 张</small>
          </button>
        ) : null}
      </div>
    </section>
  )
}

/* ── Context Menu ── */

function EditorContextMenu({ x, y, onClose, onInsertImage, imagesCount }: { x: number; y: number; onClose: () => void; onInsertImage: () => void; imagesCount: number }) {
  const full = imagesCount >= 3
  return (
    <div className="journal-ctx-menu" style={{ left: x, top: y }} role="menu">
      <button className="journal-ctx-menu-item" role="menuitem" disabled={full} onClick={() => { onInsertImage(); onClose() }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
        </svg>
        <span>插入图片{full ? '（最多3张）' : ''}</span>
      </button>
    </div>
  )
}

/* ── Polish Modal ── */

function PolishModal({ original, polished, onAccept, onReject, onContinuePolish, polishing }: {
  original: string; polished: string; onAccept: () => void; onReject: () => void; onContinuePolish: () => void; polishing: boolean
}) {
  return (
    <div className="journal-polish-overlay" role="dialog" aria-modal="true">
      <div className="journal-polish-modal">
        <h2 className="journal-polish-modal__title">AI 润色预览</h2>
        <div className="journal-polish-modal__grid">
          <div className="journal-polish-modal__col">
            <span className="journal-polish-modal__label">原文</span>
            <div className="journal-polish-modal__content markdown-content" dangerouslySetInnerHTML={{ __html: renderJournalMarkdown(original) }} />
          </div>
          <div className="journal-polish-modal__col">
            <span className="journal-polish-modal__label">润色后</span>
            <div className="journal-polish-modal__content markdown-content" dangerouslySetInnerHTML={{ __html: renderJournalMarkdown(polished) }} />
          </div>
        </div>
        <div className="journal-polish-modal__actions">
          <button className="journal-polish-btn journal-polish-btn--continue" onClick={onContinuePolish} disabled={polishing}>{polishing ? '润色中...' : '🔄 继续润色'}</button>
          <button className="journal-polish-btn journal-polish-btn--reject" onClick={onReject}>❌ 拒绝</button>
          <button className="journal-polish-btn journal-polish-btn--accept" onClick={onAccept}>✅ 接受修改</button>
        </div>
      </div>
    </div>
  )
}

/* ── Parse images from markdown content ── */
const IMG_RE = /!\[.*?\]\((data:image\/[^)]+)\)/g
function extractImages(content: string): string[] {
  const imgs: string[] = []
  let m: RegExpExecArray | null
  while ((m = IMG_RE.exec(content)) !== null) { imgs.push(m[1]) }
  return imgs.slice(0, MAX_JOURNAL_IMAGES)
}
function stripImages(content: string): string {
  return content.replace(IMG_RE, '').replace(/\n{3,}/g, '\n\n').trim()
}

/* ── Main Component ── */

export default function TodayNotesDocument({
  entry, editMode, polishing, polishedPreview, onSave, onPolish, onAcceptPolish, onRejectPolish, formatDateTime,
}: TodayNotesDocumentProps) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [showPolishModal, setShowPolishModal] = useState(false)
  const [polishContent, setPolishContent] = useState('')
  const [ctxMenu, setCtxMenu] = useState<CtxMenuState>({ x: 0, y: 0, visible: false })
  const [images, setImages] = useState<string[]>([])

  // Load images from entry on mount / entry change
  useEffect(() => {
    if (entry?.content) {
      setImages(extractImages(entry.content))
    }
  }, [entry?.content])

  const textContent = entry?.content ? stripImages(entry.content) : ''

  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: '开始写今天的笔记...' })],
    content: textContent ? renderJournalMarkdown(textContent) : '',
    editorProps: { attributes: { class: 'journal-editor-content' } },
    onUpdate: ({ editor }) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const md = htmlToMarkdown(editor.getHTML())
        saveCombined(md, images)
      }, 2000)
    },
  })

  const saveCombined = useCallback((textMd: string, imgs: string[]) => {
    const imgBlock = imgs.slice(0, MAX_JOURNAL_IMAGES).map((src, i) => `![image-${i + 1}](${src})`).join('\n')
    const combined = [textMd.trim(), imgBlock].filter(Boolean).join('\n\n')
    onSave(combined)
  }, [onSave])

  const insertImage = useCallback(() => {
    if (images.length >= MAX_JOURNAL_IMAGES) return
    const inp = document.createElement('input')
    inp.type = 'file'; inp.accept = 'image/*'
    inp.onchange = (ev: Event) => {
      const file = (ev.target as HTMLInputElement).files?.[0]
      if (!file) return
      const r = new FileReader()
      r.onload = () => {
        const dataUrl = r.result as string
        setImages(prev => {
          const next = [...prev, dataUrl].slice(0, MAX_JOURNAL_IMAGES)
          // Immediate save
          if (editor) {
            saveCombined(htmlToMarkdown(editor.getHTML()), next)
          }
          return next
        })
      }
      r.readAsDataURL(file)
    }
    inp.click()
  }, [editor, images.length, saveCombined])

  const removeImage = useCallback((idx: number) => {
    setImages(prev => {
      const next = prev.filter((_, i) => i !== idx)
      if (editor) {
        saveCombined(htmlToMarkdown(editor.getHTML()), next)
      }
      return next
    })
  }, [editor, saveCombined])

  useEffect(() => {
    if (!editor || !editMode) return
    const el = editor.view.dom
    const onCtx = (e: MouseEvent) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, visible: true }) }
    el.addEventListener('contextmenu', onCtx)
    return () => el.removeEventListener('contextmenu', onCtx)
  }, [editor, editMode])

  useEffect(() => {
    if (!editor) return
    const cur = editor.getHTML()
    if (!editMode || !cur || cur === '<p></p>') {
      const target = textContent ? renderJournalMarkdown(textContent) : ''
      if (cur !== target) editor.commands.setContent(target)
    }
  }, [textContent, editor, editMode])

  useEffect(() => { if (polishedPreview) { setPolishContent(polishedPreview); setShowPolishModal(true) } }, [polishedPreview])

  useEffect(() => {
    if (!ctxMenu.visible) return
    const handler = () => setCtxMenu(prev => ({ ...prev, visible: false }))
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [ctxMenu.visible])

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current) }, [])

  if (editMode) {
    return (
      <div className="journal-doc-shell journal-doc-shell--today">
        {ctxMenu.visible && <EditorContextMenu x={ctxMenu.x} y={ctxMenu.y} onClose={() => setCtxMenu(prev => ({ ...prev, visible: false }))} onInsertImage={insertImage} imagesCount={images.length} />}
        {showPolishModal && editor && (
          <PolishModal original={htmlToMarkdown(editor.getHTML())} polished={polishContent}
            onAccept={() => { setShowPolishModal(false); onAcceptPolish() }}
            onReject={() => { setShowPolishModal(false); onRejectPolish() }}
            onContinuePolish={onPolish} polishing={polishing} />
        )}
        <div className="journal-today-stack journal-today-stack--edit">
          <ImageGallery images={images} onAddImage={insertImage} onRemove={removeImage} />
          <EditorContent editor={editor} className="journal-editor" />
        </div>
      </div>
    )
  }

  // Preview mode
  return (
    <div className="journal-doc-shell journal-doc-shell--today">
      {entry ? (
        <article className="journal-doc-main journal-doc-main--today">
          <div className="journal-doc-main-scroll">
            <div className="journal-today-stack">
              <ImageGallery images={images} isReadOnly onRemove={() => {}} />
              <div className="journal-doc-body journal-doc-body--today markdown-content" dangerouslySetInnerHTML={{ __html: renderJournalMarkdown(textContent) }} />
            </div>
            <div className="journal-doc-meta-row"><span>上次编辑于 {formatDateTime(entry.updated_at)}</span></div>
          </div>
        </article>
      ) : (
        <div className="journal-empty journal-empty--main">
          <p>今天还没有写笔记。</p>
          <p>点击右上角编辑按钮开始记录今天的学习心得。</p>
        </div>
      )}
    </div>
  )
}
