import { PRACTICE_MODE_LABELS, type PracticeMode } from '@ielts-vocab/app-core'
import type { NavigateOptions } from '../navigation/types'
import type { PracticeEntryKey } from './PracticeEntryPanel'

export function scoreLabel(label: string, value: number) {
  return `${label} ${value}`
}

export function entryForMode(mode?: PracticeMode): PracticeEntryKey {
  if (mode === 'errors') return 'errors'
  if (mode === 'follow') return 'follow'
  if (mode === 'quickmemory' || mode === 'test') return 'ebbinghaus'
  return 'regular'
}

export function entryLabel(entry: PracticeEntryKey | null, mode: PracticeMode) {
  if (entry === 'errors') return '错词练习'
  if (entry === 'ebbinghaus') return '艾宾浩斯'
  if (entry === 'follow') return '跟读练习'
  return PRACTICE_MODE_LABELS[mode]
}

export function searchableText(value: unknown) {
  return String(value ?? '').toLowerCase()
}

export function isRecognitionReviewMode(mode?: PracticeMode) {
  return mode === 'quickmemory' || mode === 'test'
}

function hasExplicitScope(options?: NavigateOptions) {
  return Boolean(options?.bookId || options?.chapterId != null)
}

export function initialEntry(options?: NavigateOptions): PracticeEntryKey | null {
  if (!options?.bookId && !options?.mode) return null
  if (hasExplicitScope(options) && isRecognitionReviewMode(options.mode)) return 'regular'
  return entryForMode(options.mode)
}

export function initialDueReviewRequested(options?: NavigateOptions) {
  return isRecognitionReviewMode(options?.mode) && !hasExplicitScope(options)
}
