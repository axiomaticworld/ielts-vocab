import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LearningJournalPage from './LearningJournalPage'

const apiFetchMock = vi.fn()

vi.mock('../../../lib', async () => {
  const actual = await vi.importActual<typeof import('../../../lib')>('../../../lib')
  return {
    ...actual,
    apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  }
})

vi.mock('@tiptap/react', () => ({
  EditorContent: ({ className }: { className?: string }) => (
    <div className={className}>
      <div className="journal-editor-content" />
    </div>
  ),
  useEditor: (config: { content?: string }) => ({
    commands: { setContent: vi.fn() },
    getHTML: () => config.content || '<p></p>',
    view: {
      dom: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    },
  }),
}))

const todayEntry = {
  id: 1,
  date: '2026-06-03',
  content: '# 你好\n\n今天复习了 attention。',
  polished_content: null,
  created_at: '2026-06-03T04:00:00',
  updated_at: '2026-06-03T04:31:00',
}

describe('LearningJournalPage diary view', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('shows a page loading gate before the today entry resolves', async () => {
    let resolveToday: ((value: { entry: null }) => void) | null = null
    apiFetchMock.mockImplementation((url: string) => {
      if (url === '/api/notes/journal/today') {
        return new Promise(resolve => {
          resolveToday = resolve
        })
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`))
    })

    const { container } = render(<LearningJournalPage />)

    expect(container.querySelector('.page-skeleton--journal')).not.toBeNull()
    resolveToday?.({ entry: null })

    await screen.findByRole('tab', { name: '今日笔记' })
  })

  it('renders the today diary entry and keeps the old summary tabs out', async () => {
    apiFetchMock.mockImplementation((url: string) => {
      if (url === '/api/notes/journal/today') {
        return Promise.resolve({ entry: todayEntry })
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`))
    })

    const { container } = render(<LearningJournalPage />)

    expect(await screen.findByRole('tab', { name: '今日笔记' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '历史笔记' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '每日总结' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: '问答历史' })).not.toBeInTheDocument()
    expect(container.querySelector('.journal-doc-shell--today')).not.toBeNull()
    expect(container.querySelector('.journal-doc-body h1')?.textContent).toContain('你好')
    expect(screen.getByRole('button', { name: '编辑笔记' })).toBeInTheDocument()
  })

  it('renders diary images as capped top attachments', async () => {
    const imageMarkdown = Array.from({ length: 4 }, (_, index) => (
      `![image-${index + 1}](data:image/png;base64,card${index + 1})`
    )).join('\n')
    apiFetchMock.mockImplementation((url: string) => {
      if (url === '/api/notes/journal/today') {
        return Promise.resolve({
          entry: {
            ...todayEntry,
            content: `# 你好\n\n${imageMarkdown}`,
          },
        })
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`))
    })

    const { container } = render(<LearningJournalPage />)

    expect(await screen.findByText('图片附件')).toBeInTheDocument()
    expect(container.querySelector('.journal-today-stack')).not.toBeNull()
    const imagePanel = container.querySelector('.journal-image-panel')
    const body = container.querySelector('.journal-doc-body')
    expect(imagePanel).not.toBeNull()
    expect(body).not.toBeNull()
    expect(imagePanel!.compareDocumentPosition(body!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(container.querySelectorAll('.journal-image-card:not(.journal-image-card--add)')).toHaveLength(3)
    expect(screen.getByText('3/3')).toBeInTheDocument()
    expect(body?.textContent).not.toContain('image-1')
  })

  it('loads history entries after switching to the history tab', async () => {
    const user = userEvent.setup()
    apiFetchMock.mockImplementation((url: string) => {
      if (url === '/api/notes/journal/today') {
        return Promise.resolve({ entry: todayEntry })
      }
      if (url.startsWith('/api/notes/journal?')) {
        return Promise.resolve({
          entries: [
            {
              ...todayEntry,
              id: 2,
              date: '2026-06-02',
              content: '昨天记录了 listening practice。',
            },
          ],
          has_more: false,
        })
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`))
    })

    const { container } = render(<LearningJournalPage />)
    await user.click(await screen.findByRole('tab', { name: '历史笔记' }))

    await screen.findByText('2026-06-02')
    expect(container.querySelector('#journal-start-date')).not.toBeNull()
    expect(container.querySelector('#journal-end-date')).not.toBeNull()
    expect(container.querySelector('.journal-history-card__preview')?.textContent).toContain('listening practice')
  })

  it('saves edited diary content and can request polish', async () => {
    const user = userEvent.setup()
    apiFetchMock.mockImplementation((url: string) => {
      if (url === '/api/notes/journal/today') {
        return Promise.resolve({ entry: todayEntry })
      }
      if (url === '/api/notes/journal') {
        return Promise.resolve({
          entry: { ...todayEntry, content: '更新后的内容' },
        })
      }
      if (url === '/api/notes/journal/polish') {
        return Promise.resolve({ polished: '润色后的内容' })
      }
      return Promise.reject(new Error(`Unexpected url: ${url}`))
    })

    render(<LearningJournalPage />)
    await user.click(await screen.findByRole('button', { name: '编辑笔记' }))
    await user.click(await screen.findByRole('button', { name: 'AI 润色' }))

    await waitFor(() => {
      expect(apiFetchMock).toHaveBeenCalledWith(
        '/api/notes/journal/polish',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })
})
