import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SearchOnSite, TextLinkToHome } from 'features';
import { TOP_BACK_IMAGE } from 'shared';

export const AppHeader = () => (
  <ImageBackground style={styles.image} source={{ uri: TOP_BACK_IMAGE }}>
    <View style={styles.content}>
      <TextLinkToHome />
      <SearchOnSite style={styles.search} />
    </View>
  </ImageBackground>
);

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  content: {
    width: '100%',
    height: '100%',
    paddingTop: 90,
    paddingHorizontal: 12,
    alignItems: 'center',
  },

  search: {
    width: '80%',
  },
});
