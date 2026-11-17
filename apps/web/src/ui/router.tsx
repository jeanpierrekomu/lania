"use client";

/**
 * Adaptador: el diseño de LANIA (importado de Figma Make) se escribió con React Router.
 * Aquí se traduce esa API mínima a la navegación de Next.js, para reutilizar las pantallas sin reescribirlas.
 * También traduce rutas del prototipo a las rutas reales de la app (p. ej. /diagnostico → /diagnostic).
 */
import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";
import { useCallback, useMemo, type ComponentProps, type ReactNode } from "react";

/** Rutas del prototipo que en la app real tienen otra dirección. */
const PATH_MAP: [RegExp, string][] = [[/^\/diagnostico(?=$|[?#])/, "/diagnostic"]];

export function resolveTo(to: string) {
  for (const [from, real] of PATH_MAP) if (from.test(to)) return to.replace(from, real);
  return to;
}

export type LinkProps = Omit<ComponentProps<typeof NextLink>, "href"> & { to: string };

export function Link({ to, ...rest }: LinkProps) {
  return <NextLink href={resolveTo(to)} {...rest} />;
}

type NavState = { isActive: boolean };

export function NavLink({
  to,
  end,
  className,
  children,
  ...rest
}: Omit<LinkProps, "className" | "children"> & {
  end?: boolean;
  className?: string | ((s: NavState) => string);
  children?: ReactNode | ((s: NavState) => ReactNode);
}) {
  const pathname = usePathname() ?? "/";
  const target = resolveTo(to).split(/[?#]/)[0];
  const isActive = end ? pathname === target : pathname === target || pathname.startsWith(`${target}/`);
  return (
    <NextLink
      href={resolveTo(to)}
      aria-current={isActive ? "page" : undefined}
      className={typeof className === "function" ? className({ isActive }) : className}
      {...rest}
    >
      {typeof children === "function" ? children({ isActive }) : children}
    </NextLink>
  );
}

export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number, opts?: { replace?: boolean }) => {
      if (typeof to === "number") return router.back();
      if (opts?.replace) router.replace(resolveTo(to));
      else router.push(resolveTo(to));
    },
    [router],
  );
}

export function useLocation() {
  const pathname = usePathname() ?? "/";
  const params = useNextSearchParams();
  const search = params?.toString() ? `?${params.toString()}` : "";
  return useMemo(() => ({ pathname, search, hash: "", key: `${pathname}${search}` }), [pathname, search]);
}

export function useSearchParams() {
  const params = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const current = useMemo(() => new URLSearchParams(params?.toString() ?? ""), [params]);
  const set = useCallback(
    (next: URLSearchParams | Record<string, string>) => {
      const q = new URLSearchParams(next).toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [router, pathname],
  );
  return [current, set] as const;
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return (useNextParams() ?? {}) as T;
}

/** Pantallas «inmersivas» (sin barras móviles): Speaking Lab y la sala en vivo. */
const IMMERSIVE = [/^\/app\/speaking(\/|$)/, /^\/app\/salones\/[^/]+/];

export function useMatches() {
  const pathname = usePathname() ?? "/";
  return [
    {
      handle: {
        immersive: IMMERSIVE.some((r) => r.test(pathname)),
        hideNavigator: true,
      },
    },
  ];
}

export function Outlet() {
  return null;
}

export function ScrollRestoration() {
  return null;
}
