# Taxonomía de habilidades

Catálogo en [`packages/content-seeds/skills/catalog.yaml`](../../packages/content-seeds/skills/catalog.yaml) (códigos del spec §2.3). En la Entrega 1 solo `grammar.present_simple.subject_verb_agreement` tiene contenido: 17 ítems originales (6 en la microclase, 11 para repaso), marcados `pilot` hasta su **revisión docente**.

Para agregar contenido: crea ítems en `packages/content-seeds/items/*.yaml` siguiendo el formato documentado al inicio de `present_simple.yaml`, corre `make test-api` (valida el YAML y que cada clave se acepte) y reinicia la API (el seed es idempotente).
