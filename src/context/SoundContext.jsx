import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';

const SoundContext = createContext(null);
const STORAGE_KEY = 'ui-sound-muted';

const getAudioContext = () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    return AudioCtx ? new AudioCtx() : null;
};

const playClick = (ctx) => {
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(620, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.0001, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.04, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

    oscillator.connect(gainNode).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.09);
};

export const SoundProvider = ({ children }) => {
    const [isMuted, setIsMuted] = useState(() => {
        if (typeof window === 'undefined') return false;
        return localStorage.getItem(STORAGE_KEY) === 'true';
    });
    const audioRef = useRef(null);
    const lastPlayedRef = useRef(0);

    const ensureAudio = useCallback(() => {
        if (!audioRef.current) {
            audioRef.current = getAudioContext();
        }
        return audioRef.current;
    }, []);

    const play = useCallback(() => {
        if (isMuted || typeof window === 'undefined') return;
        const now = Date.now();
        if (now - lastPlayedRef.current < 40) return;
        lastPlayedRef.current = now;

        const ctx = ensureAudio();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        playClick(ctx);
    }, [ensureAudio, isMuted]);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, String(next));
            }
            return next;
        });
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, String(isMuted));
        }
    }, [isMuted]);

    useEffect(() => {
        const handler = (event) => {
            if (isMuted) return;
            if (event.button && event.button !== 0) return;
            if (!(event.target instanceof Element)) return;
            const interactive = event.target.closest('button, a, [role="button"]');
            if (!interactive) return;
            if (interactive.closest('[data-sound="off"]')) return;
            const isDisabled = interactive.hasAttribute('disabled') || interactive.getAttribute('aria-disabled') === 'true';
            if (isDisabled) return;
            play();
        };

        document.addEventListener('pointerdown', handler, { capture: true });
        return () => document.removeEventListener('pointerdown', handler, { capture: true });
    }, [isMuted, play]);

    return (
        <SoundContext.Provider value={{ isMuted, toggleMute, play }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (!context) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
