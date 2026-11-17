import { CalendarClock, CircleDashed, Sprout, TrendingUp, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Schemas } from "@/lib/api/client";

const STATES = {
  not_assessed: { label: "Sin evaluar", tone: "neutral", Icon: CircleDashed },
  emerging: { label: "Empezando", tone: "accent", Icon: Sprout },
  developing: { label: "En progreso", tone: "primary", Icon: TrendingUp },
  proficient: { label: "Dominada", tone: "success", Icon: Trophy },
  review_due: { label: "Toca repasar", tone: "warning", Icon: CalendarClock },
} as const;

const CONFIDENCE = { low: "baja", medium: "media", high: "alta" } as const;

export function SkillLevelBadge({ state }: { state: Schemas["MasteryOut"]["state"] }) {
  const s = STATES[state];
  return (
    <Badge tone={s.tone}>
      <s.Icon aria-hidden /> {s.label}
    </Badge>
  );
}

export function confidenceLabel(c: Schemas["MasteryOut"]["confidence"]) {
  return `confianza ${CONFIDENCE[c]}`;
}
