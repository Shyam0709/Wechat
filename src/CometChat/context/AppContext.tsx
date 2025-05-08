import React, { ReactElement, createContext, useReducer } from 'react';
import { appReducer, defaultAppState } from './appReducer';

export const AppContext = createContext({
  appState: defaultAppState,
  setAppState: (() => {}) as React.Dispatch<unknown>,
});

export const AppContextProvider = ({ children }: { children: ReactElement }) => {
  const [appState, setAppState] = useReducer(appReducer, defaultAppState);

  return (
    <AppContext.Provider
      value={{
        appState: appState!,
        setAppState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
