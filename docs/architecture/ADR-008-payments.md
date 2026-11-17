# ADR-008 — Pagos y planes (decisión futura, no implementar todavía)

**Estado:** propuesto · 2026-11-02 · Implementar en la fase comercial (spec §13 Fase 5), **después** de validar el aprendizaje con el piloto.

## Contexto
- El spec pide no integrar pagos en el piloto (§19, pregunta 6) y no lanzar planes sin validación (§11.3).
- **Stripe no acepta empresas con sede en Perú.** Verificado el 2 nov 2026 en <https://stripe.com/global>: en Latinoamérica solo figuran Brasil y México.
- La app ya tiene las piezas que un plan necesita controlar: tope de gasto de IA, mensajes diarios con Lania y registro de costo por alumno (`ai_requests`).

## Decisión
1. **Conector intercambiable** `BillingProvider`, igual que `LLMProvider` (ADR-003): crear checkout, verificar webhook, cancelar suscripción. El dominio no depende de un procesador concreto.
2. **Pago alojado por el procesador:** la app nunca recibe ni guarda datos de tarjeta.
3. **Webhooks como fuente de verdad:** firma verificada, idempotencia por id de evento y registro en `audit_events`. El navegador nunca activa un plan.
4. **Derechos por plan** (`entitlements`): cada plan define cuotas (mensajes con Lania/día, minutos de voz/mes, correcciones de escritura/mes) que alimentan los límites que ya existen. Tablas previstas por el spec: `subscriptions` y `usage_quotas` (§6.1).
5. **Elegir el procesador según el mercado cuando llegue el momento** (comisiones y disponibilidad **a verificar** en ese momento):

| Escenario | Opción | Ventaja | Costo / contra |
|---|---|---|---|
| Clientes mayormente en Perú | Pasarela local (Culqi, Niubiz, Izipay, Mercado Pago) | Cobra en soles; medios locales | Emitir boletas/facturas electrónicas (SUNAT) por cuenta propia |
| Clientes en varios países | *Merchant of record* (Paddle, Lemon Squeezy) | Venden por ti y gestionan impuestos de cada país | Comisión mayor; confirmar pagos a Perú |
| Expansión internacional seria | Stripe vía empresa en EE. UU. (Stripe Atlas) | Ecosistema completo | Costos y trámites de una empresa extranjera |

6. **Mientras tanto (piloto):** acceso gratuito; si alguien quiere aportar, Yape o transferencia y activación manual del rol/plan por el equipo.

## Precio: piso por costo (no es una recomendación de precio)
Costo variable estimado por alumno al mes con `gpt-6-luna` + voz por turnos (ver `docs/operations/openai-candidates-2026-11-02.md`, precios verificados el 2 nov 2026):

| Perfil | Costo IA + voz aprox. |
|---|---|
| Ocasional | ~US$ 0,50 |
| Regular | ~US$ 2,70 |
| Intensivo (2 h/día) | ~US$ 7 |

Implicancia: con un plan plano, los usuarios intensivos pueden comerse el margen. Por eso los planes deben fijar **minutos de voz** (spec §11.3: «minutos de speaking justos y explícitos») y nunca anunciar «IA ilimitada». El precio final debe incluir comisión del procesador, impuestos, hosting, soporte, adquisición y reembolsos, y validarse con usuarios reales.

## Requisitos antes de cobrar (checklist)
- [ ] Métricas del piloto que justifiquen cobrar (aprendizaje medido, retención voluntaria)
- [ ] Persona o empresa formal para facturar; comprobantes electrónicos SUNAT (o *merchant of record*)
- [ ] Términos y condiciones, política de reembolsos y de privacidad (Ley N.º 29733 de protección de datos personales; asesoría legal)
- [ ] Login real con Supabase Auth (hoy es solo local)
- [ ] Tablas `subscriptions`/`usage_quotas` con RLS, webhooks firmados e idempotentes, tests de «pagó dos veces» y «webhook repetido»
- [ ] Planes revisados con datos reales de costo P50/P90 por alumno (spec §11.1)
