import { redirect } from "next/navigation";

// Las salas todavía no abren en el piloto: cualquier enlace a una sala lleva a «Próximamente».
export default function Page() {
  redirect("/app/salones");
}
