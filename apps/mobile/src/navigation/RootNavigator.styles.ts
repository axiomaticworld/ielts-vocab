import { StatusBar, StyleSheet } from 'react-native'
import { theme } from '../theme'

const statusBarInset = StatusBar.currentHeight ?? 0

export const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#FFF2E4',
    minHeight: 58 + statusBarInset,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xs,
    paddingTop: statusBarInset + theme.spacing.xs,
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    minWidth: 36,
  },
  headerButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerSpacer: {
    height: 36,
    width: 36,
  },
  loading: {
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  shell: {
    backgroundColor: '#FFF2E4',
    flex: 1,
  },
  stackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stackHeaderTitle: {
    color: theme.colors.text,
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  tabBar: {
    alignItems: 'center',
    backgroundColor: '#F8C2A8',
    borderColor: '#E99A7A',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    height: 58,
    paddingHorizontal: theme.spacing.sm,
    paddingBottom: 0,
    paddingTop: 0,
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: -4, width: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 40,
  },
  tabButton: {
    alignItems: 'center',
    borderRadius: theme.radius.control,
    flex: 1,
    gap: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingVertical: 2,
  },
  tabButtonPressed: {
    opacity: 0.86,
  },
  tabButtonPrimary: {
    backgroundColor: 'transparent',
    minHeight: 48,
    shadowOpacity: 0,
    elevation: 0,
  },
  tabButtonPrimaryActive: {
    backgroundColor: 'transparent',
  },
  tabIconBox: {
    alignItems: 'center',
    height: 34,
    justifyContent: 'center',
    width: 42,
  },
  tabIconBoxPrimary: {
    height: 34,
    width: 42,
  },
  tabIconBoxPrimaryOpen: {
    backgroundColor: '#FFFDF0',
    borderColor: 'rgba(111, 74, 56, 0.28)',
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    elevation: 7,
    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 3, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 7,
    width: 54,
  },
  tabIconBoxSelected: {
    backgroundColor: 'rgba(255, 253, 240, 0.45)',
    borderRadius: theme.radius.pill,
  },
  tabDrawnIcon: {
    height: 34,
    width: 42,
  },
  tabDrawnIconPrimary: {
    height: 34,
    width: 42,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabHeaderCopy: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  tabHeaderTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  tabLabel: {
    alignSelf: 'stretch',
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 16,
    textAlign: 'center',
  },
  tabLabelPrimary: {
    color: theme.colors.accentDark,
  },
  tabLabelActive: {
    color: '#D8662B',
    fontWeight: '800',
  },
})
