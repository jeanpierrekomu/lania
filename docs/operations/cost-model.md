# Medición de costos de IA

**Regla:** no inventamos precios. El sistema mide lo que sí sabe (tokens, latencia, estado) y calcula costo solo con precios configurados explícitamente.

1. Abre la página oficial de precios del proveedor elegido y anota fecha, modelo, región y unidad.
2. Configura `LLM_FAST_PRICE_IN_PER_MTOK`, `LLM_FAST_PRICE_OUT_PER_MTOK`, `LLM_DEEP_PRICE_IN_PER_MTOK`, `LLM_DEEP_PRICE_OUT_PER_MTOK` (USD por millón de tokens).
3. Define `MONTHLY_AI_SPEND_LIMIT_USD`: al alcanzarlo, el tutor responde «presupuesto alcanzado» y la práctica sin IA sigue funcionando.
4. Cuotas por alumno: `TUTOR_DAILY_MESSAGE_LIMIT` (por defecto 80).
5. Panel `/admin/qa` (rol docente): llamadas, salidas inválidas, errores, tokens, latencia p50/p95 y costo estimado del mes.

Con modelos locales (Ollama) el costo variable es la electricidad/hardware: deja los precios vacíos.

Fórmula de referencia (spec §11.1): costo por alumno = tokens LLM + STT + TTS + almacenamiento + reintentos.

## Voz (Entrega 3, verificado en developers.openai.com el 2026-11-13)

- **STT `gpt-transcribe`:** USD 0,0045 por minuto de audio → `STT_PRICE_PER_MINUTE_USD=0.0045`. El costo de cada turno se registra en `ai_requests` (tarea `speech_to_text`) con la duración que reporta el navegador (máx. 120 s por turno).
- **TTS `gpt-4o-mini-tts`:** USD 0,60 por millón de tokens de texto de entrada y USD 12 por millón de tokens de audio de salida. La API no devuelve los tokens de audio, así que el costo por llamada queda **desconocido** (NULL) salvo que se configure `TTS_PRICE_PER_MILLION_CHARS_USD` con una estimación propia medida en la factura.
- **⚠️ Fecha límite:** OpenAI apaga `tts-1`, `tts-1-hd` y `gpt-4o-mini-tts` el **6 de enero de 2027**. El reemplazo que propone (`gpt-realtime-2.1-mini`) solo funciona con la API Realtime, no con `/v1/audio/speech`. Antes de esa fecha hay que elegir: (a) otro proveedor de TTS (p. ej. Google, Azure, ElevenLabs) detrás del mismo `SpeechProvider`, o (b) adaptar el adaptador a Realtime. Mientras tanto, el audio ya generado queda en `tts_cache` y sigue sirviéndose; si el TTS falla, la app usa la voz del navegador.
- **Caché:** el audio de los 5 episodios y de las preguntas de Speaking se genera una sola vez (`uv run python -m app.jobs.warm_audio`, 48 audios). Solo las reacciones de Lania a cada turno se generan al momento; se borran a los 30 días (job de retención).
- **Cuotas:** `SPEAKING_DAILY_TURN_LIMIT` (60), `WRITING_DAILY_EVAL_LIMIT` (20), `RATE_LIMIT_PER_MINUTE` (120) y el tope mensual `MONTHLY_AI_SPEND_LIMIT_USD`, que ahora también cubre la voz.
