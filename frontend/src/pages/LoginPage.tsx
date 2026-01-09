import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

/**
 * Login Page - BUNDELA alpha TRADING
 */

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [step, setStep] = useState<'totp' | 'mpin'>('totp');
    const [totp, setTotp] = useState('');
    const [mpin, setMpin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    const handleTOTPSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await axios.post(`${API_URL}/auth/totp-login`, { totp });
            setStep('mpin');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'TOTP authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleMPINSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post(`${API_URL}/auth/validate-mpin`, { mpin });

            console.log('[LoginPage] MPIN Response:', response.data);

            // Extract useful info if available, or fallback
            // Kotak API returns nested data, and our Backend Router wraps it again.
            // Structure: { message: "...", data: { data: { token: "..." } } }
            let data = response.data;
            if (data.data) data = data.data; // Unwrap Router wrapper
            if (data.data) data = data.data; // Unwrap Kotak wrapper (if present)

            const token = data.access_token || data.token || data.trade_token;
            // Trying to find a user identifier
            const userId = 'Admin';

            if (token) {
                login(token, userId);
            } else {
                console.error('[LoginPage] Token missing in response:', data);
                throw new Error('No access token received in response');
            }
        } catch (err: any) {
            console.error('[LoginPage] MPIN Error:', err);
            // Show specific error if available (backend detail OR local error message)
            setError(err.response?.data?.detail || err.message || 'MPIN validation failed');
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            minHeight: '100vh',
            backgroundColor: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
        },
        card: {
            maxWidth: '400px',
            width: '100%',
            backgroundColor: '#2d2d2d',
            borderRadius: '8px',
            padding: '32px',
            border: '1px solid #3d3d3d'
        },
        title: {
            fontSize: '32px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center' as const,
            marginBottom: '8px',
            fontFamily: '"Orbitron", "Rajdhani", "Exo 2", system-ui, sans-serif',
            letterSpacing: '2px',
            textTransform: 'uppercase' as const
        },
        subtitle: {
            color: '#9ca3af',
            textAlign: 'center' as const,
            marginBottom: '32px',
            fontSize: '14px'
        },
        error: {
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#fca5a5'
        },
        label: {
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#d1d5db',
            marginBottom: '8px'
        },
        input: {
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #3d3d3d',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            marginBottom: '24px'
        },
        button: {
            width: '100%',
            padding: '12px 16px',
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: '500',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px'
        },
        buttonGroup: {
            display: 'flex',
            gap: '12px'
        },
        buttonSecondary: {
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#3d3d3d',
            color: 'white',
            fontWeight: '500',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
        },
        buttonSuccess: {
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#059669',
            color: 'white',
            fontWeight: '500',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer'
        },
        hint: {
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '8px'
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>BUNDELA alpha TRADING</h1>
                <p style={styles.subtitle}>Secure Login</p>

                {error && <div style={styles.error}>{error}</div>}

                {step === 'totp' ? (
                    <form onSubmit={handleTOTPSubmit}>
                        <label style={styles.label}>TOTP (6-digit code)</label>
                        <input
                            type="text"
                            value={totp}
                            onChange={(e) => setTotp(e.target.value)}
                            maxLength={6}
                            placeholder="123456"
                            style={styles.input}
                            required
                            disabled={loading}
                        />
                        <p style={styles.hint}>Enter code from your authenticator app</p>

                        <button
                            type="submit"
                            disabled={loading || totp.length !== 6}
                            style={{ ...styles.button, opacity: (loading || totp.length !== 6) ? 0.5 : 1 }}
                        >
                            {loading ? 'Authenticating...' : 'Continue'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleMPINSubmit}>
                        <label style={styles.label}>MPIN (6-digit code)</label>
                        <input
                            type="password"
                            value={mpin}
                            onChange={(e) => setMpin(e.target.value)}
                            maxLength={6}
                            placeholder="••••••"
                            style={styles.input}
                            required
                            disabled={loading}
                        />
                        <p style={styles.hint}>Enter your 6-digit MPIN</p>

                        <div style={styles.buttonGroup}>
                            <button
                                type="button"
                                onClick={() => {
                                    setStep('totp');
                                    setMpin('');
                                    setError('');
                                }}
                                style={styles.buttonSecondary}
                                disabled={loading}
                            >
                                Back
                            </button>
                            <button
                                type="submit"
                                disabled={loading || mpin.length !== 6}
                                style={{ ...styles.buttonSuccess, opacity: (loading || mpin.length !== 6) ? 0.5 : 1 }}
                            >
                                {loading ? 'Validating...' : 'Login'}
                            </button>
                        </div>
                    </form>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', marginTop: '20px', color: '#9ca3af' }}>
                        {step === 'totp' ? 'Authenticating TOTP...' : 'Validating MPIN...'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
