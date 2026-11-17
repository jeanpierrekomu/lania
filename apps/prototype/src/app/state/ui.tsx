import { createContext, useContext } from 'react'

export interface UiContextValue {
  openPreferences: () => void
  openScreens: () => void
}

export const UiContext = createContext<UiContextValue>({ openPreferences: () => undefined, openScreens: () => undefined })

export function useUi() {
  return useContext(UiContext)
}

/** Route `handle` flags read by the shells. */
export interface RouteHandle {
  immersive?: boolean
  hideNavigator?: boolean
}
