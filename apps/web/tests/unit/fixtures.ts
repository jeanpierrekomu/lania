import type { Schemas } from "@/lib/api/client";

export const fillBlank: Schemas["ExerciseOut"] = {
  id: "00000000-0000-0000-0000-000000000002",
  external_id: "grammar.present_simple.sva.002",
  version: 1,
  type: "fill_blank",
  skill_code: "grammar.present_simple.subject_verb_agreement",
  difficulty: 1,
  role: "practice",
  instruction_es: "Completa con el verbo en presente simple.",
  sentence_en: "My sister ___ at a design studio.",
  verb_hint: "work",
  hint_es: "My sister = she.",
};

export const choice: Schemas["ExerciseOut"] = {
  id: "00000000-0000-0000-0000-000000000001",
  external_id: "grammar.present_simple.sva.001",
  version: 1,
  type: "choice",
  skill_code: "grammar.present_simple.subject_verb_agreement",
  difficulty: 1,
  role: "warmup",
  instruction_es: "Elige la oración correcta.",
  question_en: "Which sentence is correct?",
  options: [
    { id: "a", text: "She work in marketing." },
    { id: "b", text: "She works in marketing." },
  ],
};

export function attemptResult(overrides: Partial<Schemas["EvaluationOut"]> = {}): Schemas["AttemptResultOut"] {
  return {
    attempt_id: "a1",
    idempotent_replay: false,
    evaluation: {
      id: "e1",
      status: "graded",
      verdict: "incorrect",
      score: 0,
      max_score: 1,
      matched_rule: "grammar.present_simple.third_person_s",
      feedback_es: "Con he / she / it lleva -s.",
      explanation_es: "My sister equivale a she.",
      expected_answer: "works",
      correct_sentence: "My sister works at a design studio.",
      your_answer: "work",
      errors: [
        {
          rule_code: "grammar.present_simple.third_person_s",
          explanation_es: "Con he / she / it lleva -s.",
          span: "work",
          minimal_correction: "works",
        },
      ],
      confidence: "high",
      rubric_version: "grammar_closed_v1",
      grader_version: "closed_v1",
      review_status: "none",
      next_action: "retry",
      ...overrides,
    },
    mastery: {
      skill_code: "grammar.present_simple.subject_verb_agreement",
      skill_name_es: "Presente simple y concordancia",
      state: "emerging",
      confidence: "low",
      evidence_count: 1,
      recent_accuracy: 0,
      distinct_days: 1,
      rationale_es: "0 de 1",
      algorithm_version: "mastery_v1",
    },
    next_review: {
      id: "r1",
      skill_code: "grammar.present_simple.subject_verb_agreement",
      skill_name_es: "Presente simple y concordancia",
      due_at: "2026-11-03T15:00:00Z",
      interval_days: 1,
      step: 0,
      reason: "error",
      is_due: false,
    },
  };
}
