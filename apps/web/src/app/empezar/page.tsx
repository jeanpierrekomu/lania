import type { Metadata } from "next";

import { GuestStart } from "@/components/auth/guest-start";

export const metadata: Metadata = { title: "Empezar a practicar" };

export default function StartPage() {
  return <GuestStart />;
}
