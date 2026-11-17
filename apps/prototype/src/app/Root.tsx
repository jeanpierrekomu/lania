import { useMemo, useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { PreferencesProvider } from '@/app/state/preferences'
import { LearnerProvider } from '@/app/state/learner'
import { UiContext } from '@/app/state/ui'
import { PreferencesPanel } from '@/app/components/layout/PreferencesPanel'
import { PrototypeNavigator } from '@/app/components/layout/PrototypeNavigator'

export function Root() {
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [screensOpen, setScreensOpen] = useState(false)
  const ui = useMemo(() => ({ openPreferences: () => setPrefsOpen(true), openScreens: () => setScreensOpen(true) }), [])
  return (
    <PreferencesProvider>
      <LearnerProvider>
        <UiContext.Provider value={ui}>
          <Outlet />
          <PreferencesPanel open={prefsOpen} onClose={() => setPrefsOpen(false)} />
          <PrototypeNavigator open={screensOpen} onOpenChange={setScreensOpen} />
          <ScrollRestoration />
        </UiContext.Provider>
      </LearnerProvider>
    </PreferencesProvider>
  )
}
