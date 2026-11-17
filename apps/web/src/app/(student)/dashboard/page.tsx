import { redirect } from "next/navigation";

// El inicio ahora vive en /app (diseño LANIA). Se conserva esta dirección para enlaces antiguos.
export default function DashboardRedirect() {
  redirect("/app");
}
