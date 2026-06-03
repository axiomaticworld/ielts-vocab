import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import {
  buildMobileWrongWordsReviewQueue,
  buildQuickMemoryReviewQueuePath,
  buildNextErrorReviewRoundWords,
  resolvePracticeQueueSource,
  type WrongWord,
} from '@ielts-vocab/app-core'

const mobileRoot = new URL('..', import.meta.url).pathname
const workspaceRoot = join(mobileRoot, '..', '..')

function read(relativePath: string): string {
  return readFileSync(join(workspaceRoot, relativePath), 'utf8')
}

function makeWrongWord(word: string, mistakeType: string): WrongWord {
  return {
    word,
    book_id: '',
    book_title: '',
    chapter_id: null,
    chapter_title: '',
    definition: word,
    dimension_states: {},
    ebbinghaus_completed: false,
    ebbinghaus_remaining: 0,
    ebbinghaus_streak: 0,
    examples: [],
    group_key: '',
    last_error_at: '',
    listening_confusables: [],
    mistake_type: mistakeType,
    pending_dimensions: [],
    phonetic: '',
    pos: '',
    recognition_pass_streak: 0,
    wrong_count: 1,
  }
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

  it('keeps wrong-word recovery filters and selected-word review wired on mobile', () => {
    const learnerApiSource = read('apps/mobile/src/api/learnerApi.ts')
    const errorsSource = read('apps/mobile/src/screens/ErrorsScreen.tsx')
    const practiceSource = read('apps/mobile/src/screens/PracticeScreen.tsx')
    const navigationSource = read('apps/mobile/src/navigation/types.ts')

    assert.match(learnerApiSource, /dim: filters\.dimension === 'all' \? undefined : filters\.dimension/)
    assert.match(learnerApiSource, /mode: filters\.mode === 'all' \? undefined : filters\.mode/)
    assert.match(errorsSource, /testID="errors\.practiceSelected"/)
    assert.match(errorsSource, /selectedWrongWords: selectedWordValues/)
    assert.match(errorsSource, /testID=\{`errors\.dimension\.\$\{item\.value\}`\}/)
    assert.match(errorsSource, /testID=\{`errors\.mode\.\$\{item\.value\}`\}/)
    assert.match(navigationSource, /selectedWrongWords\?: string\[\]/)
    assert.match(navigationSource, /wrongWordFilters\?: MobileWrongWordFilters/)
    assert.match(practiceSource, /buildMobileWrongWordsReviewQueue/)
    assert.match(practiceSource, /options\?\.selectedWrongWords \?\? \[\]/)
  })

  it('keeps wrong-word next-round and progress persistence wired on mobile', () => {
    const practiceSource = read('apps/mobile/src/screens/PracticeScreen.tsx')
    const progressStorageSource = read('apps/mobile/src/screens/errorReviewProgressStorage.ts')

    assert.match(progressStorageSource, /CORE_STORAGE_KEYS\.wrongWordReview/)
    assert.match(progressStorageSource, /buildErrorReviewProgress/)
    assert.match(practiceSource, /hydrateErrorReviewProgress/)
    assert.match(practiceSource, /persistErrorReviewProgress/)
    assert.match(practiceSource, /buildNextErrorReviewRoundWords/)
    assert.match(practiceSource, /testID="practice\.errors\.nextRound"/)
    assert.match(practiceSource, /updateErrorReviewRoundResults/)
  })

  it('builds selected and retry wrong-word queues with app-core helpers', () => {
    const words = [
      makeWrongWord('Alpha', 'recognition'),
      makeWrongWord('Beta', 'meaning'),
    ]

    assert.deepEqual(buildMobileWrongWordsReviewQueue(words, {}, ['Beta']).map(item => item.word), ['Beta'])
    assert.deepEqual(buildNextErrorReviewRoundWords(words, { alpha: true, beta: false }).map(item => item.word), ['Beta'])
  })
})
