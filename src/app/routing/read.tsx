import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { BookReaderScreen } from 'pages/book-reader';
import { BooksListScreen } from 'pages/books-list';
import { ReadScreen } from 'pages/read';
import type { ReadStackParamList, RootTabName, RootTabsScreenProps } from 'shared';
import { ReadStackParamName } from 'shared';

const ReadStack = createNativeStackNavigator<ReadStackParamList>();

export const ReadRouting: React.FC<RootTabsScreenProps<RootTabName.Read>> = () => (
  <ReadStack.Navigator
    initialRouteName={ReadStackParamName.Home}
    screenOptions={{
      headerShown: false,
    }}
  >
    <ReadStack.Screen component={ReadScreen} name={ReadStackParamName.Home} />
    <ReadStack.Screen component={BookReaderScreen} name={ReadStackParamName.BookReader} />
    <ReadStack.Screen component={BooksListScreen} name={ReadStackParamName.BooksList} />
  </ReadStack.Navigator>
);
