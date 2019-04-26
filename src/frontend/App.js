/* global __DEV__ */
// @flow
import * as React from "react";
import debug from "debug";
// import { useScreens } from "react-native-screens";
import SplashScreen from "react-native-splash-screen";

import ErrorScreen from "./screens/UncaughtError";
import AppLoading from "./AppLoading";
import AppContainer from "./AppContainer";
import PermissionsContext from "./context/PermissionsContext";
import AppProvider from "./context/AppProvider";

// Turn on logging if in debug mode
if (__DEV__) debug.enable("*");
const log = debug("mapeo:App");
// WARNING: This needs to change if we change the navigation structure
const NAV_STORE_KEY = "@MapeoNavigation@2";

// Use native navigation screens, see: https://github.com/kmagiera/react-native-screens
// useScreens();

/**
 * Catches Javascript errors anywhere in the child component tree, logs the
 * errors and displays a fallback UI.
 */
class ErrorBoundary extends React.Component<
  {
    children: React.Node
  },
  {
    hasError: boolean
  }
> {
  state = {
    hasError: false
  };

  static getDerivedStateFromError(error: Error) {
    log(error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // This is rendered outside AppLoading, so SpashScreen could still be
    // showing if error occurs in AppLoading before it's hidden
    SplashScreen.hide();
    log("Uncaught error in component tree:", error);
    log(info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return <ErrorScreen />;
  }
}

const App = () => (
  <ErrorBoundary>
    {/* Permissions provider must be before AppLoading because it waits for
        permissions before showing main app screen */}
    <PermissionsContext.Provider>
      <AppLoading>
        {/* AppProvider must be after AppLoading because it makes requests to the
            mapeo-core server. AppLoading only renders children once the server
            is ready and listening */}
        <AppProvider>
          <AppContainer persistenceKey={NAV_STORE_KEY} />
        </AppProvider>
      </AppLoading>
    </PermissionsContext.Provider>
  </ErrorBoundary>
);

export default App;