import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildCsv,
  buildPracticeOptions,
  buildProgressSnapshot,
  buildQuickMemoryReviewQueuePath,
  buildQuickMemorySyncRecord,
  buildWrongWordRecord,
  chooseSmartPracticeDimension,
  evaluateSmartPracticeAttempt,
  evaluatePracticeAnswer,
  normalizeSmartStatsPayload,
  recordSmartPracticeResult,
  resolvePracticeQueueSource,
  selectSmartPracticeDimension,
  stripHtml,
  type MobileWord,
} from '../src'

const word: MobileWord = {
  word: 'Dynamic',
  definition: '动态的',
  phonetic: '/daɪˈnæmɪk/',
  pos: 'adj.',
  group_key: '',
  book_id: 'book-1',
  book_title: 'Book',
  chapter_id: 1,
  chapter_title: 'Chapter',
  examples: [],
  listening_confusables: [],
}

describe('mobile practice engine', () => {
  it('normalizes HTML prompts and spelling answers', () => {
    assert.equal(stripHtml('<p>Hello&nbsp;<strong>world</strong></p>'), 'Hello world')
    assert.equal(evaluatePracticeAnswer(word, 'meaning', ' dynamic ').correct, true)
    assert.equal(evaluatePracticeAnswer(word, 'dictation', 'dynamical').correct, false)
    assert.equal(evaluatePracticeAnswer(word, 'listening', word.definition).correct, true)
  })

  it('uses learner profile context as the smart-mode fallback dimension', () => {
    const dimension = chooseSmartPracticeDimension(word, {}, {
      learnerProfile: {
        dimensions: [
          { dimension: 'listening', weakness: 0.8 },
          { dimension: 'meaning', weakness: 0.2 },
        ],
      },
    })

    assert.equal(dimension, 'listening')
    assert.equal(evaluatePracticeAnswer(word, 'smart', word.definition, { smartDimension: dimension }).correct, true)
    assert.equal(evaluatePracticeAnswer(word, 'smart', word.word, { smartDimension: dimension }).correct, false)
  })

  it('prefers learner-profile weakest summary before raw dimension order', () => {
    const selection = selectSmartPracticeDimension({
      word,
      stats: {},
      context: {
        learnerProfile: {
          summary: { weakest_mode: 'listening' },
          dimensions: [{ dimension: 'meaning', accuracy: 20 }],
        },
      },
    })

    assert.deepEqual(selection, { dimension: 'listening', mode: 'listening' })
  })

  it('evaluates smart attempts against the selected dimension', () => {
    const attempt = evaluateSmartPracticeAttempt({
      word,
      answer: word.definition,
      stats: {},
      context: { learningStats: { alltime: { weakest_mode: 'listening' } } },
    })

    assert.equal(attempt.dimension, 'listening')
    assert.equal(attempt.mode, 'listening')
    assert.equal(attempt.result.correct, true)
  })

  it('selects weak smart dimensions from per-word stats before generic spelling', () => {
    const stats = normalizeSmartStatsPayload([{
      word: 'dynamic',
      listening: { correct: 4, wrong: 0 },
      meaning: { correct: 0, wrong: 3 },
      dictation: { correct: 1, wrong: 0 },
    }])

    const dimension = chooseSmartPracticeDimension(word, stats, undefined, () => 0.4)
    assert.equal(dimension, 'meaning')
    assert.equal(evaluatePracticeAnswer(word, 'smart', 'dynamic', { smartDimension: dimension }).correct, true)
    assert.equal(evaluatePracticeAnswer(word, 'smart', word.definition, { smartDimension: dimension }).correct, false)
  })

  it('records smart answer deltas and maps smart wrong-word dimensions', () => {
    const afterWrong = recordSmartPracticeResult({}, word, 'dictation', false)
    const afterCorrect = recordSmartPracticeResult(afterWrong, word, 'dictation', true)

    assert.deepEqual(afterCorrect.dynamic.dictation, { correct: 1, wrong: 1 })
    assert.equal(buildWrongWordRecord(word, 'smart', 'dictation').mistake_type, 'dictation')
    assert.equal(buildWrongWordRecord(word, 'smart', 'listening').mistake_type, 'listening')
  })

  it('builds progress and sync payloads for answer flows', () => {
    const snapshot = buildProgressSnapshot({
      correctCount: 1,
      currentIndex: 1,
      queue: [word],
      wrongCount: 0,
    })
    assert.deepEqual(snapshot.answeredWords, ['Dynamic'])
    assert.equal(snapshot.isCompleted, true)

    const wrong = buildWrongWordRecord(word, 'listening')
    assert.equal(wrong.mistake_type, 'listening')
    assert.equal(buildWrongWordRecord(word, 'test').mistake_type, 'recognition')
    assert.equal(evaluatePracticeAnswer(word, 'test', 'known').correct, true)
    assert.equal(evaluatePracticeAnswer(word, 'test', 'unknown').correct, false)

    const quick = buildQuickMemorySyncRecord(word, false, 1000)
    assert.equal(quick.unknownCount, 1)
    assert.equal(quick.bookId, 'book-1')
  })

  it('creates option and export helpers for mobile screens', () => {
    const options = buildPracticeOptions(word, [
      word,
      { ...word, word: 'Static', definition: '静态的' },
    ])
    assert.ok(options.includes('动态的'))
    assert.match(buildCsv([{ word: 'a,b', definition: '"quoted"' }]), /"a,b"/)
  })

  it('separates quick-memory due review from normal chapter queues', () => {
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: true, mode: 'quickmemory' }), 'due-review')
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: true, mode: 'test' }), 'due-review')
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: false, mode: 'quickmemory' }), 'chapter')
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: true, mode: 'listening' }), 'chapter')
    assert.equal(resolvePracticeQueueSource({ dueReviewRequested: true, mode: 'errors' }), 'errors')
  })

  it('builds the mobile quick-memory review queue path with scope filters', () => {
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

  it('skips inflected distractors when building listening options', () => {
    const listeningWord: MobileWord = {
      ...word,
      word: 'guide',
      phonetic: '/gaid/',
      definition: '向导',
    }
    const options = buildPracticeOptions(listeningWord, [
      listeningWord,
      { ...word, word: 'guiding', definition: '引导；“guide”的现在分词' },
      { ...word, word: 'guided', definition: '有指导的；“guide”的过去式和过去分词' },
      { ...word, word: 'guides', definition: '向导；“guide”的复数' },
      { ...word, word: 'guy', phonetic: '/gai/', definition: '家伙' },
      { ...word, word: 'guise', phonetic: '/gaiz/', definition: '伪装' },
      { ...word, word: 'guile', phonetic: '/gail/', definition: '狡诈' },
      { ...word, word: 'guild', phonetic: '/gild/', definition: '协会' },
    ])

    assert.equal(options.length, 4)
    assert.ok(options.includes('向导'))
    assert.ok(options.includes('家伙'))
    assert.ok(options.includes('伪装'))
    assert.ok(options.includes('狡诈'))
    assert.ok(!options.includes('引导；“guide”的现在分词'))
    assert.ok(!options.includes('有指导的；“guide”的过去式和过去分词'))
    assert.ok(!options.includes('向导；“guide”的复数'))
    assert.ok(!options.includes('协会'))
  })

  it('prefers preset listening confusables before falling back to the chapter queue', () => {
    const listeningWord: MobileWord = {
      ...word,
      word: 'power',
      phonetic: '/ˈpaʊə(r)/',
      definition: '力量；电源；权力',
      listening_confusables: [
        { word: 'powerful', phonetic: '/ˈpaʊəfəl/', pos: 'adj.', definition: '强大的' },
        { word: 'powder', phonetic: '/ˈpaʊdə(r)/', pos: 'n.', definition: '粉末' },
        { word: 'tower', phonetic: '/ˈtaʊə(r)/', pos: 'n.', definition: '塔' },
        { word: 'powers', phonetic: '/ˈpaʊəz/', pos: 'n.', definition: '力量；“power”的复数' },
      ],
    }

    const options = buildPracticeOptions(listeningWord, [
      listeningWord,
      { ...word, word: 'random', definition: '随机的' },
      { ...word, word: 'distant', definition: '遥远的' },
      { ...word, word: 'noise', definition: '噪音' },
    ])

    assert.equal(options.length, 4)
    assert.ok(options.includes('力量；电源；权力'))
    assert.ok(options.includes('强大的'))
    assert.ok(options.includes('粉末'))
    assert.ok(options.includes('塔'))
    assert.ok(!options.includes('力量；“power”的复数'))
    assert.ok(!options.includes('随机的'))
  })
})
