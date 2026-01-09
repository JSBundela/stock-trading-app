import React, { createContext, useContext, useState, useEffect } from 'react';

// Define types for User and Auth Context
interface User {
    id: string; // UCC or similar
    name?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (token: string, userId: string) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Check for existing session on mount
        const token = localStorage.getItem('authToken');
        const userId = localStorage.getItem('userId'); // Assuming we store this on login

        // Also check "authenticated" flag if used previously
        const authFlag = localStorage.getItem('authenticated');

        if (token && authFlag === 'true') {
            setUser({ id: userId || 'Unknown' });
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    const login = (token: string, userId: string) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('userId', userId);
        localStorage.setItem('authenticated', 'true');
        setUser({ id: userId });
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
        setIsAuthenticated(false);
        // Rely on router or explicit navigation to handle redirect if needed, 
        // or window.location.href if hard reload desired
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for consuming auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
