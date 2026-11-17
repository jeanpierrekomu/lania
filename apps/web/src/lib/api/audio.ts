"use client";

/**
 * Audio de la API (voz de Lania y episodios). Un <audio src> no puede enviar el token,
 * así que se descarga con autorización y se reproduce desde una URL local (blob) cacheada en memoria.
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { API_BASE_URL } from "./client";
import { getSession } from "@/lib/auth/session";

const cache = new Map<string, Promise<string>>();

export function fetchAudioUrl(path: string): Promise<string> {
  let hit = cache.get(path);
  if (!hit) {
    hit = (async () => {
      const token = getSession()?.accessToken;
      const res = await fetch(`${API_BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`audio ${res.status}`);
      return URL.createObjectURL(await res.blob());
    })();
    hit.catch(() => cache.delete(path));
    cache.set(path, hit);
  }
  return hit;
}

function start(audio: HTMLAudioElement, url: string, rate: number, onEnded: () => void) {
  audio.src = url;
  audio.playbackRate = rate;
  audio.onended = onEnded;
  return audio.play();
}

/** Reproduce un audio de la API; si falla, avisa con `onError` para usar la voz del navegador. */
export function useApiAudio() {
  const el = useRef<HTMLAudioElement | null>(null);
  const token = useRef(0);
  const [playing, setPlaying] = useState(false);

  const stop = useCallback(() => {
    token.current += 1;
    el.current?.pause();
    setPlaying(false);
  }, []);

  useEffect(() => stop, [stop]);

  const play = useCallback(
    async (path: string, { rate = 1, onEnd, onError }: { rate?: number; onEnd?: () => void; onError?: () => void } = {}) => {
      stop();
      const my = ++token.current;
      setPlaying(true);
      try {
        const url = await fetchAudioUrl(path);
        if (my !== token.current) return;
        el.current ??= new Audio();
        await start(el.current, url, rate, () => {
          if (my !== token.current) return;
          setPlaying(false);
          onEnd?.();
        });
      } catch {
        if (my !== token.current) return;
        setPlaying(false);
        onError?.();
      }
    },
    [stop],
  );

  return { play, stop, playing };
}
