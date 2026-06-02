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

const shortcutModes: PracticeMode[] = ['smart', 'listening', 'meaning', 'dictation', 'quickmemory', 'follow', 'radio']
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
const centerActionSource = require('../assets/stickers/practice-quick-action.png')
const centerOpenSource = require('../assets/stickers/tab-practice-entry-drawn.png')
const ORBIT_ACTION_WIDTH = 68
const ORBIT_BOTTOM_ALIGNMENT = -13
const ORBIT_INNER_RADIUS_X = 126
const ORBIT_INNER_RADIUS_Y = 93
const ORBIT_OUTER_LIFT = 90
const ORBIT_INNER_ANGLES = [165, 115, 65, 15]
const ORBIT_INNER_MODES: PracticeMode[] = ['smart', 'listening', 'meaning', 'dictation']
const ORBIT_OUTER_MODES: PracticeMode[] = ['quickmemory', 'follow', 'radio']
const innerOrbitLayout = ORBIT_INNER_MODES.map((mode, index) => {
  const radians = ((ORBIT_INNER_ANGLES[index] ?? 90) * Math.PI) / 180
  return {
    bottom: Math.round((ORBIT_INNER_RADIUS_Y * Math.sin(radians)) + ORBIT_BOTTOM_ALIGNMENT),
    mode,
    translateX: Math.round((ORBIT_INNER_RADIUS_X * Math.cos(radians)) - (ORBIT_ACTION_WIDTH / 2)),
  }
})
const outerOrbitLayout = ORBIT_OUTER_MODES.map((mode, index) => {
  const left = innerOrbitLayout[index]
  const right = innerOrbitLayout[index + 1]
  return {
    bottom: Math.round(((left.bottom + right.bottom) / 2) + ORBIT_OUTER_LIFT),
    mode,
    translateX: Math.round((left.translateX + right.translateX) / 2),
  }
})
const orbitLayout = [...innerOrbitLayout, ...outerOrbitLayout]

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
              <Sticker height={31} keyName={modeStickerKeys[mode]} width={31} />
            </View>
            <Text numberOfLines={1} style={styles.actionLabel}>{quickActionLabels[mode]}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityLabel="关闭练习快捷菜单"
        accessibilityRole="button"
        onPress={onDismiss}
        style={styles.centerButton}
        testID="practice.quickAction.center"
      >
        <Image resizeMode="contain" source={centerOpenSource} style={styles.centerIcon} />
      </Pressable>
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
  centerButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 39,
    bottom: 24,
    height: 78,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    transform: [{ translateX: -39 }],
    width: 78,
    zIndex: 72,
    elevation: 10,
  },
  centerIcon: {
    height: 68,
    width: 68,
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
    borderRadius: 21,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 42,
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
    zIndex: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  orbitGuide: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 184,
    borderWidth: 1,
    bottom: 18,
    height: 220,
    position: 'absolute',
    width: 220,
  },
  orbitStage: {
    bottom: 34,
    height: 260,
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
