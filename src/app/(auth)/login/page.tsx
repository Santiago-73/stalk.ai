'use client'

import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Lock } from 'lucide-react'
import Link from 'next/link'
import { login } from '../actions'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    async function handleGoogle() {
        setGoogleLoading(true)
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${location.origin}/auth/callback` }
        })
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const formData = new FormData(e.currentTarget)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', padding: 20,
            backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%)'
        }}>
            <div style={{ width: '100%', maxWidth: 400 }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'linear-gradient(135deg, #7c3aed, #e879f9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Eye size={20} color="white" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>
                            Stalk<span style={{ color: 'var(--accent-bright)' }}>.ai</span>
                        </span>
                    </Link>
                    <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Welcome back</p>
                </div>

                <div className="card" style={{ padding: 32, borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                        <Lock size={18} color="var(--accent-bright)" />
                        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Log in to your account</h1>
                    </div>

                    {/* Google */}
                    <button
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 10, padding: '11px 16px', marginBottom: 20, borderRadius: 10,
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                            opacity: googleLoading ? 0.7 : 1, transition: 'border-color 0.2s',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                        </svg>
                        {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>or</span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                required
                                className="input"
                            />
                        </div>

                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    name="password"
                                    type={showPass ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    required
                                    className="input"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                                        display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                                color: '#fca5a5', fontSize: 13
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{ width: '100%', justifyContent: 'center', fontSize: 15, padding: '12px', opacity: loading ? 0.7 : 1 }}
                        >
                            {loading ? 'Logging in...' : <><span>Log in</span> <ArrowRight size={15} /></>}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" style={{ color: 'var(--accent-bright)', textDecoration: 'none', fontWeight: 600 }}>
                        Sign up free
                    </Link>
                </p>
            </div>
        </div>
    )
}
