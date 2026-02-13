"use client";

import { useCallback, useRef, useEffect } from "react";

/* ============================================================
   Audio Manifest Types
   ============================================================ */
interface AudioClip {
    src: string | null;
    type: "ambient" | "one-shot" | "silence";
    gain: number;
    loop: boolean;
    fadeInMs?: number;
    durationMs?: number;
    duckOthersTo?: number;
}

interface AudioManifest {
    version: string;
    clips: Record<string, AudioClip>;
}

/* ============================================================
   useAudio Hook
   Supports: gain, ducking, crossfade, one-shots, silence
   No spatial audio per Phase 1 spec
   ============================================================ */
export function useAudio() {
    const ctxRef = useRef<AudioContext | null>(null);
    const manifestRef = useRef<AudioManifest | null>(null);
    const activeSourcesRef = useRef<Map<string, { source: AudioBufferSourceNode; gainNode: GainNode }>>(new Map());
    const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

    // Initialize AudioContext (lazy, on user gesture)
    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            ctxRef.current = new AudioContext();
        }
        if (ctxRef.current.state === "suspended") {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    }, []);

    // Load manifest
    useEffect(() => {
        fetch("/audio/manifest.json")
            .then((r) => r.json())
            .then((m: AudioManifest) => {
                manifestRef.current = m;
            })
            .catch(() => {
                console.warn("Audio manifest not loaded — audio disabled");
            });
    }, []);

    // Load audio buffer (cached)
    const loadBuffer = useCallback(
        async (src: string): Promise<AudioBuffer | null> => {
            const ctx = getCtx();
            if (bufferCacheRef.current.has(src)) {
                return bufferCacheRef.current.get(src)!;
            }
            try {
                const resp = await fetch(src);
                const data = await resp.arrayBuffer();
                const buffer = await ctx.decodeAudioData(data);
                bufferCacheRef.current.set(src, buffer);
                return buffer;
            } catch {
                console.warn(`Failed to load audio: ${src}`);
                return null;
            }
        },
        [getCtx],
    );

    // Duck all active sources
    const duckAll = useCallback((targetGain: number, durationMs: number = 300) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        activeSourcesRef.current.forEach(({ gainNode }) => {
            gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + durationMs / 1000);
        });
    }, []);

    // Restore ducked sources
    const unduckAll = useCallback((durationMs: number = 300) => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        const manifest = manifestRef.current;
        if (!manifest) return;
        activeSourcesRef.current.forEach(({ gainNode }, key) => {
            const clip = manifest.clips[key];
            if (clip) {
                gainNode.gain.linearRampToValueAtTime(clip.gain, ctx.currentTime + durationMs / 1000);
            }
        });
    }, []);

    // Play a cue by key
    const play = useCallback(
        async (cueKey: string) => {
            const manifest = manifestRef.current;
            if (!manifest || !manifest.clips[cueKey]) return;

            const clip = manifest.clips[cueKey];
            const ctx = getCtx();

            // Handle silence cue
            if (clip.type === "silence") {
                if (clip.duckOthersTo !== undefined) {
                    duckAll(clip.duckOthersTo);
                    setTimeout(() => unduckAll(), clip.durationMs || 1500);
                }
                return;
            }

            if (!clip.src) return;

            // Duck others if specified
            if (clip.duckOthersTo !== undefined) {
                duckAll(clip.duckOthersTo);
            }

            const buffer = await loadBuffer(clip.src);
            if (!buffer) return;

            // Stop existing source with same key (crossfade for ambient)
            const existing = activeSourcesRef.current.get(cueKey);
            if (existing) {
                existing.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
                setTimeout(() => {
                    try { existing.source.stop(); } catch { }
                }, 500);
            }

            const source = ctx.createBufferSource();
            const gainNode = ctx.createGain();

            source.buffer = buffer;
            source.loop = clip.loop;
            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Fade in
            if (clip.fadeInMs) {
                gainNode.gain.setValueAtTime(0, ctx.currentTime);
                gainNode.gain.linearRampToValueAtTime(clip.gain, ctx.currentTime + clip.fadeInMs / 1000);
            } else {
                gainNode.gain.setValueAtTime(clip.gain, ctx.currentTime);
            }

            source.start();
            activeSourcesRef.current.set(cueKey, { source, gainNode });

            // Clean up one-shots
            if (!clip.loop) {
                source.onended = () => {
                    activeSourcesRef.current.delete(cueKey);
                    if (clip.duckOthersTo !== undefined) {
                        unduckAll();
                    }
                };
            }
        },
        [getCtx, loadBuffer, duckAll, unduckAll],
    );

    // Stop a specific cue
    const stop = useCallback(
        (cueKey: string, fadeOutMs: number = 500) => {
            const ctx = ctxRef.current;
            const entry = activeSourcesRef.current.get(cueKey);
            if (!ctx || !entry) return;

            entry.gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOutMs / 1000);
            setTimeout(() => {
                try { entry.source.stop(); } catch { }
                activeSourcesRef.current.delete(cueKey);
            }, fadeOutMs);
        },
        [],
    );

    // Stop all audio
    const stopAll = useCallback(() => {
        activeSourcesRef.current.forEach((_, key) => stop(key));
    }, [stop]);

    return { play, stop, stopAll };
}
