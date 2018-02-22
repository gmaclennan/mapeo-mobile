// @flow
import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { NavigationActions, withNavigation } from 'react-navigation';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { DARK_GREY, LIGHT_GREY, MANGO } from '@lib/styles';

type Props = {
  navigation: NavigationActions;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: DARK_GREY
  },
  header: {
    flexDirection: 'row'
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: LIGHT_GREY
  }
});

const Categories = (props: Props) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableHighlight onPress={() => props.navigation.goBack()}>
          <Icon color="gray" name="close" size={25} />
        </TouchableHighlight>
        <Text style={styles.title}>Categories</Text>
      </View>
    </View>
  );
};

export default withNavigation(Categories);
