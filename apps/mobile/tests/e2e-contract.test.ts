import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'

const mobileRoot = new URL('..', import.meta.url).pathname
const workspaceRoot = join(mobileRoot, '..', '..')
const flowDir = join(mobileRoot, 'e2e', 'maestro')
const runnerPath = join(mobileRoot, 'scripts', 'run-maestro-e2e.sh')

const requiredFlowFiles = [
  '_login.yaml',
  'login-smoke.yaml',
  '00-login-smoke.yaml',
  '01-book-chapter-practice.yaml',
  '02-wrong-word-recovery.yaml',
  '03-global-search-word-detail.yaml',
  '04-stats-ai-journal-exams.yaml',
  '05-feedback-and-advanced-entry.yaml',
] as const

const requiredSelectorNeedles = [
  'login.account.entry',
  'login.account.submit',
  'testID={`screen.${routeState.current.screen}`}',
  'tab.${item.key}',
  'header.search',
  'header.ai',
  'home.layout-guide',
  'home.hero.continue',
  'testID={`home.object.${object.key}`}',
  'search.input',
  'practice.quickAction.${mode}',
  'practice.quickAction.center',
  'practice.entry.${item.key}',
  'practice.quickmemory.known',
  'ai.prompt',
  'feedback.title',
] as const

const requiredHomeObjectKeys = [
  "key: 'practice-yard'",
  "key: 'wrong-kit'",
  "key: 'todo-list'",
] as const

function read(relativePath: string): string {
  return readFileSync(join(workspaceRoot, relativePath), 'utf8')
}

describe('mobile Maestro E2E contract', () => {
  it('defines the first Web-parity mobile E2E flow set', () => {
    for (const file of requiredFlowFiles) {
      const path = join(flowDir, file)
      assert.equal(existsSync(path), true, `${file} should exist`)
      const content = readFileSync(path, 'utf8')
      assert.match(content, /^appId: com\.axiomaticworld\.ieltsvocab/m)
    }
  })

  it('keeps root and mobile scripts wired to the Maestro runner', () => {
    assert.equal(existsSync(runnerPath), true)
    const runner = readFileSync(runnerPath, 'utf8')
    assert.match(runner, /maestro test/)
    assert.match(runner, /ielts_vocab_api35/)
    assert.match(read('package.json'), /mobile:e2e:android/)
    assert.match(read('apps/mobile/package.json'), /e2e:android/)
  })

  it('exposes stable selectors used by the smoke flows', () => {
    const source = [
      read('apps/mobile/src/navigation/RootNavigator.tsx'),
      read('apps/mobile/src/navigation/PracticeActionMenu.tsx'),
      read('apps/mobile/src/screens/HomeScreen.tsx'),
      read('apps/mobile/src/components/StudyRoomScene.tsx'),
      read('apps/mobile/src/screens/LoginScreen.tsx'),
      read('apps/mobile/src/components/AccountLoginPane.tsx'),
      read('apps/mobile/src/screens/PracticeEntryPanel.tsx'),
      read('apps/mobile/src/screens/PracticeScreen.tsx'),
      read('apps/mobile/src/screens/SearchScreen.tsx'),
      read('apps/mobile/src/screens/AIChatScreen.tsx'),
      read('apps/mobile/src/screens/ProfileScreen.tsx'),
    ].join('\n')

    for (const needle of requiredSelectorNeedles) {
      assert.ok(source.includes(needle), `${needle} should be present in mobile source`)
    }

    for (const needle of requiredHomeObjectKeys) {
      assert.ok(source.includes(needle), `${needle} should be present in mobile source`)
    }
  })

  it('keeps AI out of the home scene because the shell already exposes it', () => {
    const homeSource = [
      read('apps/mobile/src/screens/HomeScreen.tsx'),
      read('apps/mobile/src/components/StudyRoomScene.tsx'),
    ].join('\n')

    assert.equal(homeSource.includes('home.object.ai-letter'), false)
    assert.equal(homeSource.includes('AI 信件'), false)
  })

  it('keeps home side entries as icon shortcuts instead of large cards', () => {
    const sceneSource = [
      read('apps/mobile/src/components/StudyRoomScene.tsx'),
      read('apps/mobile/src/components/StudyRoomScene.styles.ts'),
    ].join('\n')

    assert.equal(sceneSource.includes('iconDock'), true)
    assert.equal(sceneSource.includes('iconBubble'), true)
    assert.equal(sceneSource.includes('iconBubbleAligned'), false)
    assert.equal(sceneSource.includes('rightRail'), false)
    assert.equal(sceneSource.includes('railItem'), false)
  })

  it('sizes the home board from the hidden scene layout guide', () => {
    const sceneSource = read('apps/mobile/src/components/StudyRoomScene.tsx')

    assert.match(sceneSource, /SCENE_SPEECH_ROW_HEIGHT/)
    assert.match(sceneSource, /setSceneHeight\(event\.nativeEvent\.layout\.height\)/)
    assert.match(sceneSource, /testID="home\.layout-guide"/)
    assert.match(sceneSource, /Animated\.timing\(boardReveal/)
    assert.match(sceneSource, /height: boardRevealHeight/)
  })

  it('keeps the home wallpaper as a horizontally draggable wide scene', () => {
    const sceneSource = read('apps/mobile/src/components/StudyRoomScene.tsx')
    const sceneStyles = read('apps/mobile/src/components/StudyRoomScene.styles.ts')

    assert.equal(existsSync(join(workspaceRoot, 'apps/mobile/src/assets/stickers/study-room-wide-wallpaper.png')), true)
    assert.match(sceneSource, /PanResponder\.create/)
    assert.match(sceneSource, /WIDE_WALLPAPER_ASPECT_RATIO/)
    assert.match(sceneSource, /wallpaperOffsetXRef/)
    assert.match(sceneSource, /testID="home\.scene\.drag"/)
    assert.match(sceneSource, /testID="home\.wallpaper\.drag"/)
    assert.match(sceneSource, /<Animated\.View\n        \{\.\.\.wallpaperPanResponder\.panHandlers\}/)
    assert.match(sceneSource, /<View onLayout=\{event => setSceneHeight\(event\.nativeEvent\.layout\.height\)\} style=\{styles\.scene\}>/)
    assert.match(sceneStyles, /sceneDraggableStage/)
    assert.match(sceneStyles, /sceneWideWallpaper/)
  })

  it('keeps the home header shortcuts fixed outside the draggable scene', () => {
    const sceneSource = read('apps/mobile/src/components/StudyRoomScene.tsx')

    const draggableStagePosition = sceneSource.indexOf('testID="home.scene.drag"')
    const fixedHeaderPosition = sceneSource.indexOf('<View style={styles.sceneHeader}>')

    assert.notEqual(draggableStagePosition, -1)
    assert.notEqual(fixedHeaderPosition, -1)
    assert.ok(fixedHeaderPosition > draggableStagePosition)
  })

  it('opens the center practice tab as an in-place action menu', () => {
    const navigatorSource = read('apps/mobile/src/navigation/RootNavigator.tsx')
    const practiceActionMenuSource = read('apps/mobile/src/navigation/PracticeActionMenu.tsx')
    const practiceEntrySource = read('apps/mobile/src/screens/PracticeEntryPanel.tsx')
    const practiceStyles = read('apps/mobile/src/screens/PracticeScreen.styles.ts')
    const navigatorStyles = read('apps/mobile/src/navigation/RootNavigator.styles.ts')

    assert.match(navigatorSource, /const rootTabKeys: ScreenKey\[\] = \['home', 'books', 'stats', 'profile'\]/)
    assert.equal(navigatorSource.includes('Animated.timing(practiceSpin'), false)
    assert.equal(navigatorSource.includes("outputRange: ['0deg', '45deg']"), false)
    assert.equal(navigatorSource.includes("if (finished) navigate('practice')"), false)
    assert.match(navigatorSource, /<PracticeActionMenu/)
    assert.match(navigatorSource, /onPress=\{primary \? openPractice : \(\) => navigate\(item\.key\)\}/)
    assert.match(navigatorStyles, /tabButtonPrimary: \{\n    backgroundColor: 'transparent'/)
    assert.equal(navigatorStyles.includes('tabButtonPrimary: {\n    backgroundColor: theme.colors.surfaceElevated'), false)
    assert.match(practiceActionMenuSource, /const shortcutModes: PracticeMode\[\] = \['smart', 'listening', 'meaning', 'dictation', 'quickmemory', 'follow', 'radio'\]/)
    assert.equal(practiceActionMenuSource.includes('PRACTICE_GROUPS.flatMap'), false)
    assert.match(practiceActionMenuSource, /testID="practice\.quickAction\.fullscreen"/)
    assert.match(practiceActionMenuSource, /const ORBIT_BOTTOM_ALIGNMENT = -13/)
    assert.match(practiceActionMenuSource, /const ORBIT_INNER_RADIUS_X = 126/)
    assert.match(practiceActionMenuSource, /const ORBIT_INNER_RADIUS_Y = 93/)
    assert.match(practiceActionMenuSource, /const ORBIT_OUTER_LIFT = 90/)
    assert.match(practiceActionMenuSource, /const ORBIT_INNER_ANGLES = \[165, 115, 65, 15\]/)
    assert.match(practiceActionMenuSource, /const ORBIT_OUTER_MODES: PracticeMode\[\] = \['quickmemory', 'follow', 'radio'\]/)
    assert.match(practiceActionMenuSource, /const outerOrbitLayout = ORBIT_OUTER_MODES\.map/)
    assert.match(practiceActionMenuSource, /\(\(left\.bottom \+ right\.bottom\) \/ 2\) \+ ORBIT_OUTER_LIFT/)
    assert.match(practiceActionMenuSource, /\(left\.translateX \+ right\.translateX\) \/ 2/)
    assert.match(practiceActionMenuSource, /const orbitLayout = \[\.\.\.innerOrbitLayout, \.\.\.outerOrbitLayout\]/)
    assert.match(practiceActionMenuSource, /styles\.orbitStage/)
    assert.match(practiceActionMenuSource, /styles\.orbitAction/)
    assert.match(practiceActionMenuSource, /styles\.orbitGuide/)
    assert.equal(practiceActionMenuSource.includes('<ScrollView'), false)
    assert.equal(practiceActionMenuSource.includes('quickGrid'), false)
    assert.equal(practiceActionMenuSource.includes('quickCard'), false)
    assert.equal(practiceActionMenuSource.includes('modeRow'), false)
    assert.match(practiceActionMenuSource, /practice-quick-action\.png/)
    assert.match(practiceActionMenuSource, /tab-practice-entry-drawn\.png/)
    assert.match(practiceActionMenuSource, /选择一个练习模式开始/)
    assert.match(practiceActionMenuSource, /testID=\{`practice\.quickAction\.\$\{mode\}`\}/)
    assert.match(practiceActionMenuSource, /testID="practice\.quickAction\.backdrop"/)
    assert.match(practiceActionMenuSource, /testID="practice\.quickAction\.center"/)
    assert.match(practiceActionMenuSource, /centerOpenSource = require\('\.\.\/assets\/stickers\/tab-practice-entry-drawn\.png'\)/)
    assert.match(navigatorSource, /practice: require\('\.\.\/assets\/stickers\/tab-practice-drawn\.png'\)/)
    assert.match(navigatorSource, /navigate\('practice', \{ mode \}\)/)
    assert.equal(practiceActionMenuSource.includes("import { X } from 'lucide-react-native'"), false)
    assert.equal(/overlay:\s+\{[^}]+backgroundColor: '#FFFDF0'/u.test(practiceActionMenuSource), true)
    assert.equal(practiceActionMenuSource.includes('今天想练哪一项'), false)
    assert.match(practiceEntrySource, /const PRACTICE_ENTRY_SHORTCUTS = PRACTICE_GROUPS\.flatMap/)
    assert.equal(practiceEntrySource.includes('二级面板'), false)
    assert.match(practiceEntrySource, /testID=\{`practice\.modeShortcut\.\$\{item\.key\}`\}/)
    assert.match(practiceEntrySource, /style=\{\(\{ pressed \}\) => \[styles\.modeShortcut, pressed \? styles\.modeShortcutPressed : null\]\}/)
    assert.match(practiceStyles, /modeShortcutRail: \{/)
    assert.match(practiceStyles, /entryTilePressed: \{/)
  })
})
