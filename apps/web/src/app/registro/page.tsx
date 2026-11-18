import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignupPage() {
  return (
    <Suspense>
      <AuthScreen mode="signup" />
    </Suspense>
  );
}
