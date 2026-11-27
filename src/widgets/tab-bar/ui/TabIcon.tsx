import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { isLoaded } from 'expo-font'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, type TextStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'

// The tab icons are drawn as glyph text so their tint can ride the same
// animated style as the label: `@expo/vector-icons` renders plain Text under
// the hood, but its color prop is a React value and would flip only on the
// route commit — a frame (or several) after the capsule lands on native.
const AnimatedText = Animated.createAnimatedComponent(Text)
const ICON_SIZE = 28

interface IconFamily {
  fontFamily: string
  glyphs: Record<string, number | string>
  load: () => Promise<void>
}

interface IconSet {
  active: string
  family: IconFamily
  inactive: string
}

const ANT_DESIGN: IconFamily = {
  fontFamily: AntDesign.getFontFamily(),
  glyphs: AntDesign.getRawGlyphMap(),
  load: AntDesign.loadFont,
}

const IONICONS: IconFamily = {
  fontFamily: Ionicons.getFontFamily(),
  glyphs: Ionicons.getRawGlyphMap(),
  load: Ionicons.loadFont,
}

const MATERIAL_COMMUNITY: IconFamily = {
  fontFamily: MaterialCommunityIcons.getFontFamily(),
  glyphs: MaterialCommunityIcons.getRawGlyphMap(),
  load: MaterialCommunityIcons.loadFont,
}

// Route → (active/inactive) glyph pair from the matching icon family. The
// fallback is the «Слушать»-family book icon, as before.
const ICON_SETS: Record<string, IconSet> = {
  book: { active: 'book', family: IONICONS, inactive: 'book-outline' },
  index: { active: 'home', family: IONICONS, inactive: 'home-outline' },
  listen: { active: 'play-circle', family: ANT_DESIGN, inactive: 'play-circle' },
  more: {
    active: 'dots-horizontal',
    family: MATERIAL_COMMUNITY,
    inactive: 'dots-horizontal',
  },
  playlists: {
    active: 'playlist-music',
    family: MATERIAL_COMMUNITY,
    inactive: 'playlist-music-outline',
  },
  search: { active: 'search', family: IONICONS, inactive: 'search' },
  sections: { active: 'grid', family: IONICONS, inactive: 'grid-outline' },
  sermons: { active: 'mic', family: IONICONS, inactive: 'mic-outline' },
}

const DEFAULT_ICON_SET = ICON_SETS.book

// Mirrors `@expo/vector-icons`: the glyph is only painted once its font family
// finished loading, so the first frame never shows a fallback character.
const useIconFontLoaded = ({ fontFamily, load }: IconFamily) => {
  const [fontLoaded, setFontLoaded] = useState(() => isLoaded(fontFamily))

  useEffect(() => {
    if (fontLoaded) return

    let cancelled = false

    void load().then(() => {
      if (!cancelled) setFontLoaded(true)
    })

    return () => {
      cancelled = true
    }
  }, [fontFamily, fontLoaded, load])

  return fontLoaded
}

const getGlyphChar = (glyph: number | string | undefined) => {
  if (glyph === undefined) return undefined

  return typeof glyph === 'number' ? String.fromCodePoint(glyph) : glyph
}

export const TabIcon = ({
  colorStyle,
  isActive,
  routeName,
}: {
  /** Animated tint shared with the label — the capsule-overlap worklet output. */
  colorStyle: AnimatedStyle<TextStyle>
  isActive: boolean
  routeName: string
}) => {
  const icon = ICON_SETS[routeName] ?? DEFAULT_ICON_SET
  const { family } = icon
  const isFontLoaded = useIconFontLoaded(family)
  const glyphChar = getGlyphChar(family.glyphs[isActive ? icon.active : icon.inactive])

  if (!isFontLoaded || glyphChar === undefined) return null

  return (
    <AnimatedText
      numberOfLines={1}
      allowFontScaling={false}
      style={[styles.icon, { fontFamily: family.fontFamily }, colorStyle]}
    >
      {glyphChar}
    </AnimatedText>
  )
}

const styles = StyleSheet.create({
  icon: { fontSize: ICON_SIZE },
})
