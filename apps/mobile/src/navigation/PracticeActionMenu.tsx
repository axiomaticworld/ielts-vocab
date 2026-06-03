import React from 'react'
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { PRACTICE_MODE_LABELS, type PracticeMode } from '@ielts-vocab/app-core'
import { Sticker } from '../components/stickers'
import type { StickerKey } from '../components/stickers/catalog'
import { theme } from '../theme'
import { PracticeCenterIcon } from './PracticeCenterIcon'

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
const ORBIT_ACTION_WIDTH = 64
const TRIANGLE_NODE_SPACING = 88
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
const LEFT_TO_RIGHT_REVEAL_ORDER = new Map(
  [...orbitLayout]
    .sort((left, right) => (left.translateX === right.translateX ? left.bottom - right.bottom : left.translateX - right.translateX))
    .map((item, index) => [item.mode, index] as const),
)

function layoutForMode(mode: PracticeMode) {
  return orbitLayout.find(item => item.mode === mode) ?? orbitLayout[0]
}

function orbitStyle(mode: PracticeMode) {
  const layout = layoutForMode(mode)
  return {
    bottom: layout.bottom,
  }
}

function modeRevealStyle(mode: PracticeMode, reveal: Animated.Value) {
  const layout = layoutForMode(mode)
  const order = LEFT_TO_RIGHT_REVEAL_ORDER.get(mode) ?? 0
  const start = order * 0.09
  const end = start + 0.34
  return {
    opacity: reveal.interpolate({
      extrapolate: 'clamp',
      inputRange: [start, end],
      outputRange: [0, 1],
    }),
    transform: [
      { translateX: layout.translateX },
      {
        translateY: reveal.interpolate({
          extrapolate: 'clamp',
          inputRange: [start, end],
          outputRange: [20, 0],
        }),
      },
      {
        scale: reveal.interpolate({
          extrapolate: 'clamp',
          inputRange: [start, end],
          outputRange: [0.82, 1],
        }),
      },
    ],
  }
}

export function PracticeActionMenu({ onDismiss, onSelect }: PracticeActionMenuProps) {
  const reveal = React.useRef(new Animated.Value(0)).current
  const closingRef = React.useRef(false)

  React.useEffect(() => {
    const opening = Animated.timing(reveal, {
      duration: 720,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    })
    opening.start()
    return () => opening.stop()
  }, [reveal])

  const dismissWithAnimation = React.useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    Animated.timing(reveal, {
      duration: 260,
      easing: Easing.in(Easing.quad),
      toValue: 0,
      useNativeDriver: true,
    }).start(() => onDismiss())
  }, [onDismiss, reveal])

  const centerRotate = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  })
  const heroOpacity = reveal.interpolate({
    extrapolate: 'clamp',
    inputRange: [0.12, 0.42],
    outputRange: [0, 1],
  })
  const heroTranslateY = reveal.interpolate({
    extrapolate: 'clamp',
    inputRange: [0.12, 0.42],
    outputRange: [8, 0],
  })

  return (
    <View style={styles.overlay} testID="practice.quickAction.fullscreen">
      <Animated.View pointerEvents="none" style={[styles.overlayBackground, { opacity: reveal }]} />
      <Pressable
        accessibilityLabel="关闭练习快捷菜单"
        accessibilityRole="button"
        onPress={dismissWithAnimation}
        style={styles.backdrop}
        testID="practice.quickAction.backdrop"
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }]}
        testID="practice.quickAction.content"
      >
        <Image resizeMode="contain" source={centerActionSource} style={styles.heroIcon} />
        <Text style={styles.eyebrow}>练习快捷入口</Text>
        <Text style={styles.title}>选择一个练习模式开始</Text>
      </Animated.View>

      <View pointerEvents="box-none" style={styles.orbitStage}>
        <View pointerEvents="none" style={styles.orbitGuide} />
        {shortcutModes.map(mode => (
          <Animated.View key={mode} style={[styles.orbitAction, orbitStyle(mode), modeRevealStyle(mode, reveal)]}>
            <Pressable
              accessibilityLabel={`快捷练习-${PRACTICE_MODE_LABELS[mode]}`}
              accessibilityRole="button"
              onPress={() => onSelect(mode)}
              style={({ pressed }) => [styles.orbitActionButton, pressed ? styles.actionPressed : null]}
              testID={`practice.quickAction.${mode}`}
            >
              <View style={styles.iconShell}>
                <Sticker height={30} keyName={modeStickerKeys[mode]} width={30} />
              </View>
              <Text numberOfLines={1} style={styles.actionLabel}>{quickActionLabels[mode]}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[styles.centerButton, { transform: [{ translateX: -29 }, { rotate: centerRotate }] }]}>
        <Pressable
          accessibilityLabel="关闭练习快捷菜单"
          accessibilityRole="button"
          onPress={dismissWithAnimation}
          style={({ pressed }) => [styles.centerButtonHit, pressed ? styles.centerButtonPressed : null]}
          testID="practice.quickAction.center"
        >
          <PracticeCenterIcon open />
        </Pressable>
      </Animated.View>
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
    lineHeight: 13,
    maxWidth: 60,
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: 'center',
  },
  actionPressed: {
    opacity: 0.78,
  },
  centerButton: {
    alignItems: 'center',
    backgroundColor: '#FFFDF0',
    borderColor: '#4A3B32',
    borderRadius: 29,
    borderWidth: 1,
    bottom: 0,
    height: 58,
    justifyContent: 'center',
    left: '50%',
    position: 'absolute',
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 5, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    width: 58,
    zIndex: 45,
    elevation: 10,
  },
  centerButtonHit: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  centerButtonPressed: {
    opacity: 0.82,
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
    borderRadius: 23,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    width: 46,
    elevation: 4,
  },
  orbitAction: {
    left: '50%',
    position: 'absolute',
    width: ORBIT_ACTION_WIDTH,
  },
  orbitActionButton: {
    alignItems: 'center',
    gap: 3,
    width: ORBIT_ACTION_WIDTH,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 35,
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFDF0',
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
    bottom: 0,
    height: 430,
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
