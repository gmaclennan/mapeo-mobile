// @flow
import React from "react";
import { View, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { defineMessages, useIntl } from "react-intl";

import type { NavigationProp } from "../types";

import IconButton from "../sharedComponents/IconButton";
import { ObservationListIcon, SyncIconCircle } from "../sharedComponents/icons";
import GpsPill from "../sharedComponents/GpsPill";

const msgs = defineMessages({
  openSync: {
    id: "sharedComponents.HomeHeader.openSyncAccessibilityLabel",
    defaultMessage: "Open sync screen",
    description: "Accessibility label for button to open sync screen",
  },
  openObservationList: {
    id: "sharedComponents.HomeHeader.openObservationListAccessibilityLabel",
    defaultMessage: "View Observations",
    description:
      "Accessibility label for button to open Observation list screen",
  },
});

const HomeHeader = ({ navigation }: { navigation: NavigationProp }) => {
  const { formatMessage } = useIntl();
  const gradient = ( // $FlowFixMe - https://github.com/react-native-community/react-native-linear-gradient/issues/385
    <LinearGradient style={styles.linearGradient} colors={["#0006", "#0000"]} />
  );
  return (
    <View style={styles.header}>
      {gradient}
      <IconButton
        style={styles.leftButton}
        accessible={true}
        accessibilityLabel={formatMessage(msgs.openSync)}
        onPress={() => {
          navigation.navigate("SyncModal");
        }}
      >
        <SyncIconCircle />
      </IconButton>
      <GpsPill
        onPress={() => {
          navigation.navigate("GpsModal");
        }}
      />
      <IconButton
        style={styles.rightButton}
        accessible={true}
        accessibilityLabel={formatMessage(msgs.openObservationList)}
        onPress={() => {
          navigation.navigate("ObservationList");
        }}
        testID="observationListButton"
      >
        <ObservationListIcon />
      </IconButton>
    </View>
  );
};

export default HomeHeader;

const styles = StyleSheet.create({
  header: {
    zIndex: 100,
    top: 0,
    right: 0,
    left: 0,
    height: 60,
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rightButton: {},
  leftButton: {
    width: 60,
    height: 60,
  },
  linearGradient: {
    height: 60,
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    backgroundColor: "transparent",
  },
});
