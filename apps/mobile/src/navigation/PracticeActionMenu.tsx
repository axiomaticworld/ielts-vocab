import React from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { PRACTICE_MODE_LABELS, type PracticeMode } from '@ielts-vocab/app-core'
import { Sticker } from '../components/stickers'
import type { StickerKey } from '../components/stickers/catalog'
import { theme } from '../theme'

type PracticeActionMenuProps = {
  onDismiss: () => void
  onSelect: (mode: PracticeMode) => void
}

const shortcutModes: PracticeMode[] = ['listening', 'smart', 'follow', 'dictation', 'meaning', 'errors', 'quickmemory', 'radio']
const quickActionLabels: Record<PracticeMode, string> = {
  dictation: '听写',
  errors: '错词',
  follow: '跟读',
  listening: '听音',
  meaning: '默写',
  quickmemory: '速记',
  radio: '随身听',
  smart: '智能',
  test: '测试',
}
const modeStickerKeys: Record<PracticeMode, StickerKey> = {
  dictation: 'scrollNote',
  errors: 'wrongWordSticky',
  follow: 'recordingMic',
  listening: 'headset',
  meaning: 'vocabCardStack',
  quickmemory: 'reviewClock',
  radio: 'micBubble',
  smart: 'studyBadgePractice',
  test: 'tapePin',
}
const centerActionSource = require('../assets/stickers/tab-practice-edit-loop.png')
const ORBIT_ACTION_WIDTH = 74
const TRIANGLE_NODE_SPACING = 102
const TRIANGLE_ROW_HEIGHT = Math.round((TRIANGLE_NODE_SPACING * Math.sqrt(3)) / 2)
const TRIANGLE_BASE_ROW_BOTTOM = 0

function triangleNode(mode: PracticeMode, rowFromBase: number, columnOffset: number) {
  return {
    bottom: TRIANGLE_BASE_ROW_BOTTOM + ((rowFromBase - 1) * TRIANGLE_ROW_HEIGHT),
    mode,
    translateX: Math.round((columnOffset * TRIANGLE_NODE_SPACING) - (ORBIT_ACTION_WIDTH / 2)),
  }
}

const orbitLayout: Array<{ bottom: number; mode: PracticeMode; translateX: number }> = [
  triangleNode('quickmemory', 1, -1.5),
  triangleNode('radio', 1, 1.5),
  triangleNode('dictation', 2, -1),
  triangleNode('meaning', 2, 0),
  triangleNode('errors', 2, 1),
  triangleNode('smart', 3, -0.5),
  triangleNode('follow', 3, 0.5),
  triangleNode('listening', 4, 0),
]

function orbitStyle(mode: PracticeMode) {
  const layout = orbitLayout.find(item => item.mode === mode) ?? orbitLayout[0]
  return {
    bottom: layout.bottom,
    transform: [{ translateX: layout.translateX }],
  }
}

export function PracticeActionMenu({ onDismiss, onSelect }: PracticeActionMenuProps) {
  return (
    <View style={styles.overlay} testID="practice.quickAction.fullscreen">
      <Pressable
        accessibilityLabel="关闭练习快捷菜单"
        accessibilityRole="button"
        onPress={onDismiss}
        style={styles.backdrop}
        testID="practice.quickAction.backdrop"
      />

      <View pointerEvents="none" style={styles.hero} testID="practice.quickAction.content">
        <Image resizeMode="contain" source={centerActionSource} style={styles.heroIcon} />
        <Text style={styles.eyebrow}>练习快捷入口</Text>
        <Text style={styles.title}>选择一个练习模式开始</Text>
      </View>

      <View pointerEvents="box-none" style={styles.orbitStage}>
        <View pointerEvents="none" style={styles.orbitGuide} />
        {shortcutModes.map(mode => (
          <Pressable
            accessibilityLabel={`快捷练习-${PRACTICE_MODE_LABELS[mode]}`}
            accessibilityRole="button"
            key={mode}
            onPress={() => onSelect(mode)}
            style={({ pressed }) => [styles.orbitAction, orbitStyle(mode), pressed ? styles.actionPressed : null]}
            testID={`practice.quickAction.${mode}`}
          >
            <View style={styles.iconShell}>
              <Sticker height={40} keyName={modeStickerKeys[mode]} width={40} />
            </View>
            <Text numberOfLines={1} style={styles.actionLabel}>{quickActionLabels[mode]}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  actionLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(240, 177, 129, 0.9)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    color: theme.colors.text,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 14,
    maxWidth: 68,
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: 'center',
  },
  actionPressed: {
    opacity: 0.78,
  },
  eyebrow: {
    color: '#D8662B',
    fontSize: 13,
    fontWeight: '900',
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 80,
  },
  heroIcon: {
    height: 90,
    width: 90,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    borderColor: '#4A3B32',
    borderRadius: 29,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 58,
    elevation: 4,
  },
  orbitAction: {
    alignItems: 'center',
    gap: 3,
    left: '50%',
    position: 'absolute',
    width: ORBIT_ACTION_WIDTH,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFDF0',
    zIndex: 35,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  orbitGuide: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 250,
    borderWidth: 1,
    bottom: 0,
    height: 500,
    position: 'absolute',
    width: 340,
  },
  orbitStage: {
    bottom: 92,
    height: 500,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  title: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },
})
