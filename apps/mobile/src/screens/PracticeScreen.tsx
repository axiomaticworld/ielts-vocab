import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import { CheckCircle2, ChevronRight, Mic, XCircle } from 'lucide-react-native'
import {
  PRACTICE_MODE_LABELS,
  buildMobileWrongWordsReviewQueue,
  buildNextErrorReviewRoundWords,
  buildPracticeOptions,
  buildProgressSnapshot,
  buildQuickMemorySyncRecord,
  buildWrongWordRecord,
  evaluatePracticeAnswer,
  resolvePracticeQueueSource,
  updateErrorReviewRoundResults,
  type ErrorReviewRoundResults,
  type MobileBook,
  type MobileChapter,
  type MobileWord,
  type PracticeMode,
  type PracticeQueueSource,
} from '@ielts-vocab/app-core'
import { loadBooks, loadChapterWords, loadChapters, loadQuickMemoryReviewQueue, loadWrongWords, syncQuickMemory, syncWrongWord } from '../api/learnerApi'
import { Card, Field, Heading, Meta, Pill, PrimaryButton, Row, ScreenScroll, StatusText } from '../components/primitives'
import { StickerLayer, practiceSheetStickerSlots } from '../components/stickers'
import type { Navigate, NavigateOptions } from '../navigation/types'
import { playRemoteAudio } from '../native/NativeAudioPlayer'
import { useMobileSpeechRecognition } from '../speech/useMobileSpeechRecognition'
import { theme } from '../theme'
import { getErrorReviewFilters, hydrateErrorReviewProgress, persistErrorReviewProgress } from './errorReviewProgressStorage'
import { PracticeCompletionCard, PracticeEntryPanel, type PracticeEntry, type PracticeEntryKey } from './PracticeEntryPanel'
import { entryForMode, initialDueReviewRequested, initialEntry, isRecognitionReviewMode, PRACTICE_MODE_HINTS, PRACTICE_MODES, searchableText } from './PracticeScreen.helpers'
import { PracticeStatusHeader } from './PracticeStatusHeader'
import { styles } from './PracticeScreen.styles'
import { completePracticeSession, hydratePracticeSession, persistPracticeSessionProgress } from './practiceSessionLifecycle'
import { practiceSessionDependencies } from './practiceSessionLifecycleRuntime'

const QUICK_MEMORY_REVIEW_LIMIT = 10
const QUICK_MEMORY_REVIEW_WINDOW_DAYS = 3

type SheetState = 'mode' | 'scope' | null

export function PracticeScreen({ navigate, options }: { navigate: Navigate; options?: NavigateOptions }) {
  const { start, state: speechState, stop } = useMobileSpeechRecognition('en')
  const [entry, setEntry] = useState<PracticeEntryKey | null>(initialEntry(options))
  const [mode, setMode] = useState<PracticeMode>(options?.mode ?? 'quickmemory')
  const [dueReviewRequested, setDueReviewRequested] = useState(initialDueReviewRequested(options))
  const [queueSource, setQueueSource] = useState<PracticeQueueSource>('chapter')
  const [sheet, setSheet] = useState<SheetState>(null)
  const [books, setBooks] = useState<MobileBook[]>([])
  const [chapters, setChapters] = useState<MobileChapter[]>([])
  const [bookId, setBookId] = useState(options?.bookId ?? '')
  const [chapterId, setChapterId] = useState<string | number | null>(options?.chapterId ?? null)
  const [scopeQuery, setScopeQuery] = useState('')
  const [queue, setQueue] = useState<MobileWord[]>([])
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [errorRoundResults, setErrorRoundResults] = useState<ErrorReviewRoundResults>({})
  const [errorReviewRound, setErrorReviewRound] = useState(1)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const cleanupRef = useRef<(() => void) | null>(null)
  const chapterBaselineRef = useRef({ correctCount: 0, wrongCount: 0 })
  const startedAtRef = useRef(Date.now())

  const selectedBook = useMemo(() => books.find(book => String(book.id) === bookId) ?? null, [bookId, books])
  const selectedChapter = useMemo(
    () => chapters.find(chapter => String(chapter.id) === String(chapterId)) ?? null,
    [chapterId, chapters],
  )
  const currentWord = queue[index]
  const completed = queue.length > 0 && index >= queue.length
  const errorReviewRetryWords = mode === 'errors' && completed
    ? buildNextErrorReviewRoundWords(queue, errorRoundResults)
    : []
  const optionsForWord = useMemo(() => currentWord ? buildPracticeOptions(currentWord, queue) : [], [currentWord, queue])
  const scopeTerm = scopeQuery.trim().toLowerCase()
  const filteredBooks = useMemo(
    () => books.filter(book => !scopeTerm || searchableText(`${book.title} ${book.description}`).includes(scopeTerm)),
    [books, scopeTerm],
  )
  const filteredChapters = useMemo(
    () => chapters.filter((chapter, idx) => !scopeTerm || searchableText(`${idx + 1} ${chapter.title}`).includes(scopeTerm)),
    [chapters, scopeTerm],
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    loadBooks()
      .then(async nextBooks => {
        if (!active) return
        setBooks(nextBooks)
        const initialBookId = options?.bookId || String(nextBooks[0]?.id ?? '')
        const shouldLoadDueReview = initialDueReviewRequested(options)
        if (!initialBookId) {
          if (options?.mode) setEntry(initialEntry(options))
          setDueReviewRequested(shouldLoadDueReview)
          if (options?.mode === 'errors') await startPractice('errors', '', null, false)
          if (shouldLoadDueReview) await startPractice(options?.mode ?? 'quickmemory', '', null, true)
          return
        }
        setBookId(initialBookId)
        const nextChapters = await loadChapters(initialBookId)
        if (!active) return
        setChapters(nextChapters)
        if (options?.bookId || options?.mode) setEntry(initialEntry(options))
        setDueReviewRequested(shouldLoadDueReview)
        if (options?.chapterId) {
          setChapterId(options.chapterId)
          await startPractice(options.mode ?? 'quickmemory', initialBookId, options.chapterId, shouldLoadDueReview)
        } else if (options?.mode === 'errors') {
          await startPractice('errors', initialBookId, null, false)
        } else if (shouldLoadDueReview) {
          await startPractice(options?.mode ?? 'quickmemory', options?.bookId ? initialBookId : '', null, true)
        }
      })
      .catch(err => setError(err instanceof Error ? err.message : '词书加载失败'))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.bookId, options?.chapterId, options?.mode])

  async function selectBook(nextBookId: string) {
    setBookId(nextBookId)
    setChapterId(null)
    setChapters(await loadChapters(nextBookId))
  }

  async function startPractice(nextMode = mode, nextBookId = bookId, nextChapterId = chapterId, nextDueReviewRequested = dueReviewRequested) {
    setLoading(true)
    setError('')
    setFeedback('')
    try {
      const nextQueueSource = resolvePracticeQueueSource({
        dueReviewRequested: nextDueReviewRequested,
        mode: nextMode,
      })
      if (nextQueueSource === 'chapter' && !nextBookId) throw new Error('请先选择练习范围')
      const errorFilters = getErrorReviewFilters(options)
      const words = nextQueueSource === 'errors'
        ? buildMobileWrongWordsReviewQueue(
          await loadWrongWords('', errorFilters),
          errorFilters,
          options?.selectedWrongWords ?? [],
        )
        : nextQueueSource === 'due-review'
          ? await loadQuickMemoryReviewQueue({
            bookId: nextBookId || null,
            chapterId: nextChapterId,
            limit: QUICK_MEMORY_REVIEW_LIMIT,
            offset: 0,
            withinDays: QUICK_MEMORY_REVIEW_WINDOW_DAYS,
          })
          : await loadChapterWords(nextBookId, nextChapterId)
      const savedErrorProgress = nextQueueSource === 'errors'
        ? await hydrateErrorReviewProgress(words, nextMode)
        : null
      const session = savedErrorProgress
        ? {
          chapterBaseline: { correctCount: 0, wrongCount: 0 },
          correctCount: savedErrorProgress.correctCount,
          index: savedErrorProgress.currentIndex,
          queue: words,
          resumed: true,
          wrongCount: savedErrorProgress.wrongCount,
        }
        : await hydratePracticeSession({
          bookId: nextBookId,
          chapterId: nextChapterId,
          dependencies: practiceSessionDependencies,
          mode: nextMode,
          queueSource: nextQueueSource,
          words,
        })
      setQueueSource(nextQueueSource)
      setQueue(session.queue)
      setIndex(session.index)
      setCorrectCount(session.correctCount)
      setWrongCount(session.wrongCount)
      setErrorRoundResults(savedErrorProgress?.results ?? {})
      setErrorReviewRound(savedErrorProgress?.round ?? 1)
      chapterBaselineRef.current = session.chapterBaseline
      setAnswer('')
      if (!words.length && nextQueueSource === 'due-review') setFeedback('暂无到期复习词，可以切换范围或稍后再来。')
      else if (!words.length && nextQueueSource === 'errors') setFeedback('当前筛选没有待恢复错词，可以换一个维度或模式。')
      else if (session.resumed) setFeedback('已恢复未完成练习')
      startedAtRef.current = Date.now()
    } catch (err) {
      setError(err instanceof Error ? err.message : '练习加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function openEntry(item: PracticeEntry) {
    if (item.key === 'speaking') {
      navigate('exams')
      return
    }
    const nextMode = item.mode ?? 'quickmemory'
    const nextDueReviewRequested = item.key === 'ebbinghaus' && isRecognitionReviewMode(nextMode)
    setEntry(item.key)
    setMode(nextMode)
    setDueReviewRequested(nextDueReviewRequested)
    if (nextMode === 'errors' || bookId || nextDueReviewRequested) await startPractice(nextMode, bookId, chapterId, nextDueReviewRequested)
    else setSheet('scope')
  }

  async function chooseMode(nextMode: PracticeMode) {
    const nextEntry = entryForMode(nextMode)
    const nextDueReviewRequested = nextEntry === 'ebbinghaus' && isRecognitionReviewMode(nextMode)
    setMode(nextMode)
    setEntry(nextEntry)
    setDueReviewRequested(nextDueReviewRequested)
    setSheet(null)
    if (nextMode === 'errors' || chapterId || queue.length || bookId || nextDueReviewRequested) {
      await startPractice(nextMode, bookId, chapterId, nextDueReviewRequested)
    }
  }

  async function chooseChapter(chapter: MobileChapter | null) {
    const nextChapterId = chapter?.id ?? null
    setChapterId(nextChapterId)
    setSheet(null)
    await startPractice(mode, bookId, nextChapterId, dueReviewRequested)
  }

  async function toggleRecording() {
    if (speechState.status === 'recording') {
      cleanupRef.current?.()
      cleanupRef.current = null
      await stop()
      return
    }
    setError('')
    try {
      cleanupRef.current = await start()
    } catch (err) {
      setError(err instanceof Error ? err.message : '无法开始录音')
    }
  }

  async function playWord() {
    if (!currentWord) return
    const params = new URLSearchParams({ w: currentWord.word, cache_only: '1' })
    await playRemoteAudio(`/api/tts/word-audio?${params.toString()}`).catch(err => {
      setError(err instanceof Error ? err.message : '播放失败')
    })
  }

  async function submit(value = answer) {
    if (!currentWord) return
    const result = evaluatePracticeAnswer(currentWord, mode, value)
    const nextCorrect = correctCount + (result.correct ? 1 : 0)
    const nextWrong = wrongCount + (result.correct ? 0 : 1)
    const nextIndex = index + 1
    const nextErrorRoundResults = mode === 'errors'
      ? updateErrorReviewRoundResults(errorRoundResults, currentWord.word, result.correct)
      : errorRoundResults
    setCorrectCount(nextCorrect)
    setWrongCount(nextWrong)
    if (mode === 'errors') setErrorRoundResults(nextErrorRoundResults)
    setFeedback(result.feedback)
    setAnswer('')
    if (!result.correct || value === 'unknown') await syncWrongWord(buildWrongWordRecord(currentWord, mode)).catch(() => undefined)
    if (mode === 'quickmemory' || mode === 'test') await syncQuickMemory(buildQuickMemorySyncRecord(currentWord, value === 'known')).catch(() => undefined)
    const snapshot = buildProgressSnapshot({ correctCount: nextCorrect, currentIndex: nextIndex, queue, wrongCount: nextWrong })
    const persistedSnapshot = await persistPracticeSessionProgress({
      bookId,
      chapterBaseline: chapterBaselineRef.current,
      chapterId,
      dependencies: practiceSessionDependencies,
      mode,
      queueSource,
      snapshot,
    }).catch(() => null)
    if (snapshot.isCompleted) {
      await completePracticeSession({
        bookId,
        chapterId,
        dependencies: practiceSessionDependencies,
        durationSeconds: Math.round((Date.now() - startedAtRef.current) / 1000),
        mode,
        queueSource,
        snapshot: persistedSnapshot ?? snapshot,
        wordCount: queue.length,
      }).catch(() => undefined)
    }
    if (queueSource === 'errors') {
      await persistErrorReviewProgress({
        correct: nextCorrect,
        current: nextIndex,
        mode,
        options,
        results: nextErrorRoundResults,
        round: errorReviewRound,
        wrong: nextWrong,
        words: queue,
      })
    }
    setIndex(nextIndex)
  }

  async function startNextErrorReviewRound() {
    const nextRound = errorReviewRound + 1
    setQueue(errorReviewRetryWords)
    setIndex(0)
    setCorrectCount(0)
    setWrongCount(0)
    setErrorRoundResults({})
    setErrorReviewRound(nextRound)
    setFeedback('已生成下一轮，仅包含本轮仍答错的词。')
    startedAtRef.current = Date.now()
    await persistErrorReviewProgress({
      correct: 0,
      current: 0,
      mode,
      options,
      results: {},
      round: nextRound,
      wrong: 0,
      words: errorReviewRetryWords,
    })
  }

  const progress = queue.length ? Math.min(100, (index / queue.length) * 100) : 0
  const chapterLabel = queueSource === 'errors'
    ? '错词队列'
    : queueSource === 'due-review'
      ? selectedChapter?.title || selectedBook?.title || '到期复习'
      : selectedChapter?.title || '全书'
  const emptyTitle = queueSource === 'due-review' ? '暂无到期复习' : mode === 'errors' ? '错词练习' : '选择章节开始练习'
  const emptyHint = queueSource === 'due-review'
    ? '当前范围没有到期词，可以切换词书/章节过滤条件后重试。'
    : mode === 'errors'
      ? '当前会读取错词队列。'
      : '可以从顶部状态栏搜索词书或章节。'

  return (
    <View style={styles.practiceRoot}>
      {error || speechState.error || loading ? (
        <View pointerEvents="none" style={styles.practiceStatusOverlay}>
          <StatusText error={error || speechState.error} loading={loading} />
        </View>
      ) : null}
      <ScreenScroll hideHeader title="练习">
        {!entry ? (
          <PracticeEntryPanel onOpen={item => void openEntry(item)} />
        ) : (
          <>
            <PracticeStatusHeader
              chapterLabel={chapterLabel}
              correctCount={correctCount}
              entry={entry}
              mode={mode}
              onOpenMode={() => setSheet('mode')}
              onOpenScope={() => setSheet('scope')}
              progress={progress}
              queueIndex={index}
              queueLength={queue.length}
              selectedBookTitle={selectedBook?.title}
              wrongCount={wrongCount}
            />
            {currentWord ? (
              <Card style={styles.workbench}>
                <View style={styles.workbenchTop}>
                  <Pill label={`${index + 1}/${queue.length || 1}`} />
                  <Pill label={speechState.status === 'recording' ? '录音中' : PRACTICE_MODE_LABELS[mode]} />
                </View>
                <Text style={styles.word}>{mode === 'meaning' ? currentWord.definition : currentWord.word}</Text>
                <Text style={styles.wordMeta}>{[currentWord.phonetic, currentWord.pos].filter(Boolean).join(' ') || 'IELTS 词条'}</Text>
                {mode !== 'meaning' ? <Text style={styles.definition}>{currentWord.definition}</Text> : null}
                {mode === 'listening' || mode === 'dictation' || mode === 'radio' ? <PrimaryButton label="播放发音" onPress={() => void playWord()} /> : null}
                {mode === 'follow' ? <PrimaryButton label={speechState.status === 'recording' ? '停止录音' : '开始跟读'} onPress={() => void toggleRecording()} /> : null}
                {mode === 'follow' ? (
                  <View style={styles.micStrip}>
                    <Mic color={theme.colors.primaryDark} size={18} />
                    <Text style={styles.micText}>音量 {Math.round(speechState.level * 100)}% · {speechState.finalText || speechState.partialText || '等待录音'}</Text>
                  </View>
                ) : null}
                {mode === 'quickmemory' || mode === 'test' ? (
                  <View style={styles.answerRow}>
                    <Pressable accessibilityLabel="认识" accessibilityRole="button" style={[styles.answerButton, styles.confirmButton]} onPress={() => void submit('known')} testID="practice.quickmemory.known">
                      <CheckCircle2 color={theme.colors.success} size={18} />
                      <Text style={styles.answerButtonText}>认识</Text>
                    </Pressable>
                    <Pressable accessibilityLabel="不认识" accessibilityRole="button" style={[styles.answerButton, styles.rejectButton]} onPress={() => void submit('unknown')} testID="practice.quickmemory.unknown">
                      <XCircle color={theme.colors.danger} size={18} />
                      <Text style={styles.answerButtonText}>不认识</Text>
                    </Pressable>
                  </View>
                ) : mode === 'listening' ? (
                  <View style={styles.choiceWrap}>
                    {optionsForWord.map(option => (
                      <Pressable key={option} accessibilityLabel={`选择答案-${option}`} accessibilityRole="button" style={styles.choiceButton} onPress={() => void submit(option)} testID="practice.choice">
                        <Text style={styles.choiceText}>{option}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : mode === 'radio' ? (
                  <PrimaryButton label="下一词" onPress={() => void submit('played')} />
                ) : mode !== 'follow' ? (
                  <>
                    <Field value={answer} onChangeText={setAnswer} placeholder="输入答案" testID="practice.answer" />
                    <PrimaryButton label="提交" onPress={() => void submit()} testID="practice.submit" />
                  </>
                ) : (
                  <PrimaryButton label="跟读完成，下一词" onPress={() => void submit('followed')} />
                )}
                {feedback ? <Meta>{feedback}</Meta> : null}
                {mode !== 'follow' && currentWord.examples?.length ? (
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleTitle}>例句</Text>
                    <Text style={styles.exampleText}>{currentWord.examples[0]?.en || ''}</Text>
                    <Text style={styles.exampleHint}>{currentWord.examples[0]?.zh || ''}</Text>
                  </View>
                ) : null}
              </Card>
            ) : completed ? (
              <>
                <PracticeCompletionCard
                  onChangeScope={() => setSheet('scope')}
                  onRestart={() => void startPractice(mode, bookId, chapterId)}
                  wordCount={queue.length} />
                {errorReviewRetryWords.length > 0 ? (
                  <Card>
                    <Heading>下一轮错词</Heading>
                    <Meta>还有 {errorReviewRetryWords.length} 个词本轮仍答错，可以只复习这些词。</Meta>
                    <PrimaryButton label="复习仍错词" onPress={() => void startNextErrorReviewRound()} testID="practice.errors.nextRound" />
                  </Card>
                ) : null}
              </>
            ) : (
              <Card>
                <Heading>{emptyTitle}</Heading>
                <Meta>{feedback || emptyHint}</Meta>
                <PrimaryButton label="选择范围" onPress={() => setSheet('scope')} />
              </Card>
            )}
          </>
        )}
      </ScreenScroll>
      <Modal animationType="slide" onRequestClose={() => setSheet(null)} transparent visible={sheet !== null}>
        <View style={styles.sheetRoot}>
          <Pressable accessibilityRole="button" onPress={() => setSheet(null)} style={styles.sheetBackdrop} />
          <View style={styles.sheetPanel}>
            <StickerLayer slots={practiceSheetStickerSlots} />
            <View style={styles.sheetGrabber} />
            {sheet === 'mode' ? (
              <>
                <Text style={styles.sheetTitle}>切换练习模式</Text>
                <Text style={styles.sheetSubtitle}>沿用当前范围，切换后直接重新出题。</Text>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent}>
                  {PRACTICE_MODES.map(item => {
                    const active = item === mode
                    return (
                      <Pressable key={item} accessibilityLabel={`练习模式-${PRACTICE_MODE_LABELS[item]}`} accessibilityRole="button" onPress={() => void chooseMode(item)} style={[styles.sheetRow, active ? styles.sheetRowActive : null]} testID={`practice.mode.${item}`}>
                        <View style={styles.sheetIcon}>
                          <Text style={styles.sheetIndex}>{PRACTICE_MODE_LABELS[item].slice(0, 1)}</Text>
                        </View>
                        <View style={styles.sheetBody}>
                          <Text style={styles.sheetLabel}>{PRACTICE_MODE_LABELS[item]}</Text>
                          <Text style={styles.sheetMeta}>{PRACTICE_MODE_HINTS[item]}</Text>
                        </View>
                        <ChevronRight color={theme.colors.textTertiary} size={18} />
                      </Pressable>
                    )
                  })}
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.sheetTitle}>选择练习范围</Text>
                <Text style={styles.sheetSubtitle}>搜索词书或章节，章节为空时默认按整本词书出题。</Text>
                <Field value={scopeQuery} onChangeText={setScopeQuery} placeholder="搜索当前词书或章节" />
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.sheetScroll} contentContainerStyle={styles.sheetScrollContent}>
                  <Text style={styles.sheetGroup}>词书</Text>
                  {filteredBooks.map(book => {
                    const active = String(book.id) === bookId
                    return (
                      <Pressable key={String(book.id)} accessibilityLabel={`选择练习词书-${book.title}`} accessibilityRole="button" onPress={() => void selectBook(String(book.id))} style={[styles.sheetRow, active ? styles.sheetRowActive : null]} testID={`practice.scope.book.${String(book.id)}`}>
                        <View style={styles.sheetBody}>
                          <Text numberOfLines={1} style={styles.sheetLabel}>{book.title}</Text>
                          <Text style={styles.sheetMeta}>{book.total_words || book.word_count || 0} 词</Text>
                        </View>
                        <ChevronRight color={theme.colors.textTertiary} size={18} />
                      </Pressable>
                    )
                  })}
                  {bookId ? <Text style={styles.sheetGroup}>章节</Text> : null}
                  {bookId ? (
                    <Pressable accessibilityLabel="选择整本词书" accessibilityRole="button" onPress={() => void chooseChapter(null)} style={[styles.sheetRow, chapterId == null ? styles.sheetRowActive : null]} testID="practice.scope.wholeBook">
                      <View style={styles.sheetIcon}>
                        <Text style={styles.sheetIndex}>全</Text>
                      </View>
                      <View style={styles.sheetBody}>
                        <Text style={styles.sheetLabel}>整本词书</Text>
                        <Text style={styles.sheetMeta}>不限定章节，按当前词书生成队列。</Text>
                      </View>
                      <ChevronRight color={theme.colors.textTertiary} size={18} />
                    </Pressable>
                  ) : null}
                  {filteredChapters.map((chapter, idx) => (
                    <Pressable key={String(chapter.id)} accessibilityLabel={`选择练习章节-${chapter.title}`} accessibilityRole="button" onPress={() => void chooseChapter(chapter)} style={[styles.sheetRow, String(chapter.id) === String(chapterId) ? styles.sheetRowActive : null]} testID={`practice.scope.chapter.${String(chapter.id)}`}>
                      <View style={styles.sheetIcon}>
                        <Text style={styles.sheetIndex}>{String(idx + 1).padStart(2, '0')}</Text>
                      </View>
                      <View style={styles.sheetBody}>
                        <Text numberOfLines={1} style={styles.sheetLabel}>{chapter.title}</Text>
                        <Text style={styles.sheetMeta}>{chapter.word_count || chapter.group_count || 0} 项</Text>
                      </View>
                      <ChevronRight color={theme.colors.textTertiary} size={18} />
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}
