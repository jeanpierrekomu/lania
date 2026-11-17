import { redirect } from "next/navigation";

// Piloto sin login: se entra como invitado. Las pantallas de cuenta (components/auth/auth-screen.tsx)
// quedan listas para cuando se quiera volver a pedir correo.
export default function LoginPage() {
  redirect("/empezar");
}
