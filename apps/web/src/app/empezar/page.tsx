import { redirect } from "next/navigation";

// Antes se entraba como invitado. Ahora se crea cuenta (Google o enlace al correo).
export default function StartPage() {
  redirect("/registro");
}
