import { createContext, useContext, useEffect, useState } from 'react'; import api from '../api/client';
const AuthContext = createContext();
export function AuthProvider({ children }) { const [user, setUser] = useState(null); const [loading, setLoading] = useState(true); useEffect(() => { api.get('/auth/me').then(r => setUser(r.data.data)).catch(() => {}).finally(() => setLoading(false)); }, []); const authenticate = async (path, values) => { const { data } = await api.post(path, values); setUser(data.data); }; return <AuthContext.Provider value={{ user, loading, login: v => authenticate('/auth/login', v), register: v => authenticate('/auth/register', v), googleLogin: credential => authenticate('/auth/google', { credential }), logout: async () => { await api.post('/auth/logout'); setUser(null); } }}>{children}</AuthContext.Provider>; }
export const useAuth = () => useContext(AuthContext);

