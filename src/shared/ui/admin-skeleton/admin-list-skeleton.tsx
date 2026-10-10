import { View } from 'react-native'
import { AdminSkeletonRow, SkeletonBar } from './admin-skeleton-row'
import { styles } from './styles'

const PlaceholderTitle = () => <SkeletonBar style={styles.titleBar} />

const PlaceholderMeta = () => <SkeletonBar style={styles.metaBar} />

// Плейсхолдер строки списка проповедей: обложка, название, подпись и ряд
// бейджей наличия медиа.
export const AdminSermonRowSkeleton = () => (
  <AdminSkeletonRow>
    <View style={styles.mediaRow}>
      <SkeletonBar style={styles.artwork} />
      <View style={styles.body}>
        <PlaceholderTitle />
        <PlaceholderMeta />
      </View>
    </View>
    <View style={styles.badgeRow}>
      <SkeletonBar style={styles.badge} />
      <SkeletonBar style={styles.badge} />
      <SkeletonBar style={styles.badge} />
    </View>
  </AdminSkeletonRow>
)

// Плейсхолдер строки списка плейлистов: обложка, название и счётчики связей.
export const AdminPlaylistRowSkeleton = () => (
  <AdminSkeletonRow>
    <View style={styles.mediaRow}>
      <SkeletonBar style={styles.artwork} />
      <View style={styles.body}>
        <PlaceholderTitle />
        <PlaceholderMeta />
      </View>
    </View>
  </AdminSkeletonRow>
)

// Плейсхолдер строки раздела: название, подпись, бейджи размеров и ручка drag.
export const AdminSectionRowSkeleton = () => (
  <AdminSkeletonRow>
    <View style={styles.body}>
      <PlaceholderTitle />
      <PlaceholderMeta />
      <View style={styles.badgeRow}>
        <SkeletonBar style={styles.badge} />
        <SkeletonBar style={styles.badge} />
      </View>
    </View>
    <SkeletonBar style={styles.dragHandle} />
  </AdminSkeletonRow>
)

// Плейсхолдер строки пользователя: аватар, имя, email и бейджи роли/логина.
export const AdminUserRowSkeleton = () => (
  <AdminSkeletonRow>
    <View style={styles.userRow}>
      <SkeletonBar style={styles.avatar} />
      <View style={styles.body}>
        <PlaceholderTitle />
        <PlaceholderMeta />
        <View style={styles.badgeRow}>
          <SkeletonBar style={styles.badge} />
          <SkeletonBar style={styles.badge} />
        </View>
      </View>
    </View>
  </AdminSkeletonRow>
)

// Плейсхолдер строки фича-флага: название, ключ и бейдж состояния.
export const AdminFlagRowSkeleton = () => (
  <AdminSkeletonRow>
    <View style={styles.body}>
      <PlaceholderTitle />
      <PlaceholderMeta />
      <View style={styles.badgeRow}>
        <SkeletonBar style={styles.badge} />
      </View>
    </View>
  </AdminSkeletonRow>
)
