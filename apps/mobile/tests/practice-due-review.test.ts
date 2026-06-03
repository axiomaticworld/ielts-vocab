import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import {
  buildQuickMemoryReviewQueuePath,
  resolvePracticeQueueSource,
} from '@ielts-vocab/app-core'

const mobileRoot = new URL('..', import.meta.url).pathname
const workspaceRoot = join(mobileRoot, '..', '..')

function read(relativePath: string): string {
  return readFileSync(join(workspaceRoot, relativePath), 'utf8')
}

describe('mobile quick-memory due review contract', () => {
  it('builds the same due-review queue endpoint shape as Web practice', () => {
    assert.equal(
      buildQuickMemoryReviewQueuePath({
        bookId: 'book-a',
        chapterId: 2,
        limit: 10,
        offset: 0,
        withinDays: 3,
      }),
      '/api/ai/quick-memory/review-queue?limit=10&within_days=3&offset=0&scope=due&book_id=book-a&chapter_id=2',
    )
  })

  it('keeps due-review recognition queues distinct from chapter/book loading', () => {
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: true, mode: 'quickmemory' }), 'due-review')
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: true, mode: 'test' }), 'due-review')
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: false, mode: 'quickmemory' }), 'chapter')
  })

  it('wires PracticeScreen to the review queue without replacing normal chapter loading', () => {
    const learnerApiSource = read('apps/mobile/src/api/learnerApi.ts')
    const practiceSource = read('apps/mobile/src/screens/PracticeScreen.tsx')

    assert.match(learnerApiSource, /export async function loadQuickMemoryReviewQueue/)
    assert.match(learnerApiSource, /buildQuickMemoryReviewQueuePath\(options\)/)
    assert.match(practiceSource, /resolvePracticeQueueSource/)
    assert.match(practiceSource, /loadQuickMemoryReviewQueue/)
    assert.match(practiceSource, /loadChapterWords\(nextBookId, nextChapterId\)/)
    assert.match(practiceSource, /queueSource === 'chapter'/)
    assert.match(practiceSource, /queueSource === 'due-review'/)
    assert.match(practiceSource, /mode === 'quickmemory' \|\| mode === 'test'/)
  })

  it('wires smart mode to profile-backed dimension choice and smart-stats sync', () => {
    const learnerApiSource = read('apps/mobile/src/api/learnerApi.ts')
    const smartHookSource = read('apps/mobile/src/screens/useMobileSmartPractice.ts')
    const practiceSource = read('apps/mobile/src/screens/PracticeScreen.tsx')

    assert.match(learnerApiSource, /export async function loadSmartStats/)
    assert.match(learnerApiSource, /\/api\/ai\/smart-stats/)
    assert.match(learnerApiSource, /export async function syncSmartStats/)
    assert.match(smartHookSource, /loadLearnerProfile\(\)/)
    assert.match(smartHookSource, /loadLearningStats\(\)/)
    assert.match(smartHookSource, /chooseSmartPracticeDimension/)
    assert.match(smartHookSource, /recordSmartPracticeResult/)
    assert.match(smartHookSource, /mode: 'smart'/)
    assert.match(practiceSource, /resolveSmartPracticeMode\(smartDimension\)/)
    assert.match(practiceSource, /const currentSmartDimension = mode === 'smart' \? smartDimension : undefined/)
    assert.match(practiceSource, /evaluatePracticeAnswer\(currentWord, mode, value, \{ smartDimension: currentSmartDimension \}\)/)
    assert.match(practiceSource, /recordSmartAnswer\(\{ bookId, chapterId, correct: result\.correct, dimension: currentSmartDimension/)
    assert.match(practiceSource, /buildWrongWordRecord\(currentWord, mode, currentSmartDimension\)/)
    assert.match(practiceSource, /mode === 'quickmemory' \|\| mode === 'test'/)
    assert.match(practiceSource, /activeMode === 'listening'/)
  })
})
