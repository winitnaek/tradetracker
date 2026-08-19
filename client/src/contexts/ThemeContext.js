import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(); export function ThemeProvider({ children }) { const [dark, setDark] = useState(() => localStorage.getItem('tt-dark') === 'true'); useEffect(() => { document.documentElement.dataset.bsTheme = dark ? 'dark' : 'light'; localStorage.setItem('tt-dark', dark); }, [dark]); return <ThemeContext.Provider value={{ dark, setDark }}>{children}</ThemeContext.Provider>; } export const useTheme = () => useContext(ThemeContext);

