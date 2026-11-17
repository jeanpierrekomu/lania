import { createContext, useContext } from 'react'

export interface UiContextValue {
  openPreferences: () => void
  openScreens: () => void
}

export const UiContext = createContext<UiContextValue>({ openPreferences: () => undefined, openScreens: () => undefined })

export function useUi() {
  return useContext(UiContext)
}

/** Datos del alumno que muestra el menú. La app real los llena con la cuenta; si faltan, se usa el alumno demo. */
export interface ShellUser {
  name: string
  subtitle: string
  onLogout?: () => void
  isStaff?: boolean
}

export const ShellUserContext = createContext<ShellUser | null>(null)

export function useShellUser() {
  return useContext(ShellUserContext)
}

/** Route `handle` flags read by the shells. */
export interface RouteHandle {
  immersive?: boolean
  hideNavigator?: boolean
}
