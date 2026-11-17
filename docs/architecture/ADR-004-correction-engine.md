# ADR-004 — Motor de corrección para ejercicios cerrados (`grammar_closed_v1`)

**Estado:** aceptado · 2026-11-02

## Pipeline (determinista, `grader_version = closed_v1`)
1. **Normalizar** respuesta y claves: minúsculas (no evaluamos mayúsculas), apóstrofos tipográficos y `´` del teclado español → `'` (antes de NFKC, que si no rompe `´`), sin puntuación, espacios colapsados, sin caracteres invisibles (zero-width, BOM) ni emojis/símbolos, horas en una sola forma (`9am`, `9 a.m.`, `9:00 a.m.`, `9.00 am` → `9 am`), contracciones seguras expandidas (`doesn't → does not`, `I'm → I am`, `won't → will not`…). `'s` y `'d` no se expanden por ambiguos.
2. **Oración completa:** si el alumno escribe toda la oración, se extrae lo que va en el hueco comparando prefijo y sufijo del enunciado. También se recorta un solapamiento parcial con el enunciado (`goes to` → `goes`; `Luis checks` → `checks`).
3. **Claves aceptadas** → `correct`.
4. **Alternativas registradas en el ítem** → su veredicto (`valid_alternative`, `less_natural`, `partial` por desajuste con la consigna).
5. **Distractores registrados** → `incorrect` con regla, explicación y corrección mínima.
6. **Diagnósticos por regla** (solo `tense: present_simple` afirmativo; usan las formas del verbo declaradas en el ítem): falta de `-s` en 3.ª persona, `-s` con sujeto no 3.ª persona, ortografía de la terminación de 3.ª persona (`studyes`, `checkes` → `incorrect` con `spelling.third_person.*`: es la regla que se enseña, no una errata), `am/is/are + verbo base` («I am study»), `-ing` sin auxiliar, `be + -ing` con concordancia correcta (inglés válido, pero no lo que pide la consigna → `partial`), `do/does + base` enfático (válido → `less_natural`; con un colectivo que acepta plural británico también `do + base`).
7. **Errores de escritura:** un solo token difiere, distancia de edición ≤1 (≤2 si ≥8 letras) y la diferencia **no** es un sufijo gramatical (`-s`, `-es`, `-ing`, `-ed`, `-d`) → `spelling_error` (`spelling.typo`). Se compara con las claves y con las alternativas de veredicto positivo. Así `wroks`, `workss` y `liv` son erratas, pero `work` vs `works` sigue siendo un error gramatical.
8. **Lecturas seguras** (solo si lo anterior no reconoce la respuesta), en este orden:
   - **Pronombre por el sujeto** que concuerda con `subject` del ítem («She works at…» para «My sister ___») → si el resto es la clave, `valid_alternative` (`grammar.subject.pronoun_substitution`); si el resto tiene un error, se informa ese error. No aplica si el alumno ya copió el sujeto («My sister she works» sigue siendo `incorrect`) ni si el sujeto del enunciado ya era un pronombre.
   - **`'s` + verbo en -ing = is** («My sister's working» → `is working`).
   - **Contracción sin apóstrofo o con el apóstrofo desplazado** (`dont`, `doesnt`, `does'nt`, `wont`, `cant`…): se repara; si así coincide con una clave o alternativa válida → `spelling_error` (`spelling.apostrophe`, 0.5); si coincide con un distractor o diagnóstico, se conserva ese veredicto y su regla.
9. Sin coincidencias → `incorrect` (`unrecognized`) con confianza `medium` y la opción «discutir corrección»; sin letras → `needs_review`.

**Golden dataset:** `apps/api/tests/golden/closed_grader_v1.yaml` (veredictos docentes, ≥100 casos) se ejecuta en `tests/unit/test_golden_grader.py`. Las discrepancias conocidas llevan `known_issue` y fallan como XPASS al corregirse; no se admiten falsos positivos sin `known_issue`.

## Veredictos y puntaje
| Veredicto | Significado | Puntaje | Evidencia |
|---|---|---|---|
| `correct` | coincide con una clave | 1 | correct |
| `valid_alternative` | otra forma legítima (p. ej. plural colectivo británico) | 1 | correct |
| `less_natural` | correcta pero menos natural en el contexto | 0.75 | correct |
| `spelling_error` | forma correcta mal escrita | 0.5 | partial |
| `partial` | inglés válido que no cumple la consigna | 0.5 | partial |
| `incorrect` | error identificado o no reconocido | 0 | incorrect |
| `needs_review` | el sistema no puede decidir | — | excluida |

Cada evaluación guarda `matched_rule`, `rubric_version`, `grader_version` y la respuesta original inmutable (un trigger impide modificar `attempts`).

## Apelación
`POST /api/v1/evaluations/{id}/dispute` marca la evaluación como `disputed` y crea un registro para revisión de contenido. Disputar no cambia la nota automáticamente.
