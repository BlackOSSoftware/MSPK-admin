import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
    theme: "theme-moonlight",
    setTheme: () => null,
    resolvedMode: "dark",
});

const DARK_THEME_SKINS = [
    "theme-moonlight",
];

const LIGHT_THEME_SKINS = [
    "theme-gradient",
    
];

const DEFAULT_DARK_SKIN = "theme-moonlight";
const LAST_DARK_THEME_KEY = "theme-dark";
const DEFAULT_LIGHT_SKIN = "theme-gradient";
const LAST_LIGHT_THEME_KEY = "theme-light-skin";

const normalizeTheme = (value) => {
    if (value === "dark") return DEFAULT_DARK_SKIN; // Backward compat
    if (value === "light") return DEFAULT_LIGHT_SKIN;
    if (value === "system") return value;
    if (DARK_THEME_SKINS.includes(value) || LIGHT_THEME_SKINS.includes(value)) return value;
    return DEFAULT_DARK_SKIN;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => normalizeTheme(localStorage.getItem("theme")));
    const [resolvedMode, setResolvedMode] = useState(() =>
        theme === "light" || LIGHT_THEME_SKINS.includes(theme) ? "light" : "dark"
    );

    const setTheme = (next) => {
        setThemeState((prev) => {
            const value = typeof next === "function" ? next(prev) : next;
            return normalizeTheme(value);
        });
    };

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("light", "dark", ...DARK_THEME_SKINS, ...LIGHT_THEME_SKINS);

        const applyModeAndSkin = (mode, skin) => {
            root.classList.remove("light", "dark", ...DARK_THEME_SKINS, ...LIGHT_THEME_SKINS);

            if (mode === "light") {
                root.classList.add("light");
                if (skin) root.classList.add(skin);
                setResolvedMode("light");
                return;
            }

            root.classList.add("dark");
            if (skin) root.classList.add(skin);
            setResolvedMode("dark");
        };

        const getLastDarkSkin = () => {
            const stored = localStorage.getItem(LAST_DARK_THEME_KEY);
            return DARK_THEME_SKINS.includes(stored) ? stored : DEFAULT_DARK_SKIN;
        };

        const getLastLightSkin = () => {
            const stored = localStorage.getItem(LAST_LIGHT_THEME_KEY);
            return LIGHT_THEME_SKINS.includes(stored) ? stored : DEFAULT_LIGHT_SKIN;
        };

        if (theme === "system") {
            const media = window.matchMedia("(prefers-color-scheme: dark)");

            const syncSystem = () => {
                const systemMode = media.matches ? "dark" : "light";
                if (systemMode === "light") {
                    applyModeAndSkin("light", getLastLightSkin());
                    return;
                }
                applyModeAndSkin("dark", getLastDarkSkin());
            };

            syncSystem();
            media.addEventListener("change", syncSystem);
            return () => media.removeEventListener("change", syncSystem);
        }

        if (LIGHT_THEME_SKINS.includes(theme)) {
            applyModeAndSkin("light", theme);
            localStorage.setItem("theme", theme);
            localStorage.setItem(LAST_LIGHT_THEME_KEY, theme);
            return;
        }

        // Dark mode + skin
        applyModeAndSkin("dark", theme);
        localStorage.setItem("theme", theme);
        localStorage.setItem(LAST_DARK_THEME_KEY, theme);
    }, [theme]);

    const value = {
        theme,
        setTheme,
        resolvedMode,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};
