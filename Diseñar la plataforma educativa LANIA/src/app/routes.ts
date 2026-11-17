import type { ComponentType } from 'react'
import { createBrowserRouter } from 'react-router'
import { Root } from './Root'
import { AppShell } from './components/layout/AppShell'
import { RouteError } from './pages/RouteError'
import { RouteLoading } from './pages/RouteLoading'

/** Route-level code splitting: each screen loads on first visit. */
const page =
  <M>(load: () => Promise<M>, pick: (m: M) => ComponentType) =>
  async () => ({ Component: pick(await load()) })

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      Component: Root,
      ErrorBoundary: RouteError,
      HydrateFallback: RouteLoading,
      children: [
        { index: true, lazy: page(() => import('./pages/Landing'), (m) => m.Landing) },
        { path: 'onboarding', lazy: page(() => import('./pages/Onboarding'), (m) => m.Onboarding) },
        { path: 'diagnostico', lazy: page(() => import('./pages/Diagnostic'), (m) => m.Diagnostic), handle: { hideNavigator: true } },
        { path: 'sistema', lazy: page(() => import('./pages/BrandSystem'), (m) => m.BrandSystem) },
        { path: 'prototipo', lazy: page(() => import('./pages/PrototypeMap'), (m) => m.PrototypeMap) },
        {
          path: 'app',
          Component: AppShell,
          children: [
            { index: true, lazy: page(() => import('./pages/Dashboard'), (m) => m.Dashboard) },
            { path: 'aula', lazy: page(() => import('./pages/Classroom'), (m) => m.Classroom) },
            { path: 'speaking', lazy: page(() => import('./pages/SpeakingLab'), (m) => m.SpeakingLab), handle: { immersive: true } },
            { path: 'listening', lazy: page(() => import('./pages/ListeningLab'), (m) => m.ListeningLab) },
            { path: 'writing', lazy: page(() => import('./pages/WritingLab'), (m) => m.WritingLab) },
            { path: 'salones', lazy: page(() => import('./pages/Rooms'), (m) => m.Rooms) },
            { path: 'salones/:roomId', lazy: page(() => import('./pages/RoomLive'), (m) => m.RoomLive), handle: { immersive: true } },
            { path: 'misiones', lazy: page(() => import('./pages/Missions'), (m) => m.Missions) },
            { path: 'progreso', lazy: page(() => import('./pages/Profile'), (m) => m.Profile) },
          ],
        },
        { path: '*', lazy: page(() => import('./pages/NotFound'), (m) => m.NotFound) },
      ],
    },
  ],
  { basename },
)
