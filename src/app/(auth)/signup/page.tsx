'use client'

import { useState } from 'react'
import { Eye, EyeOff, ArrowRight, Sparkles, Mail } from 'lucide-react'
import Link from 'next/link'
import { signup } from '../actions'

export default function SignupPage() {
    const [showPass, setShowPass] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [sentTo, setSentTo] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')
        const formData = new FormData(e.currentTarget)
        const result = await signup(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        } else if (result?.requiresConfirmation) {
            setSentTo(formData.get('email') as string)
            setEmailSent(true)
        }
    }

    if (emailSent) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-primary)', padding: 20,
                backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 60%)'
            }}>
                <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
                        background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Mail size={32} color="var(--accent-bright)" />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>Check your email</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>
                        We sent a confirmation link to
                    </p>
                    <p style={{
                        color: 'var(--accent-bright)', fontWeight: 700, fontSize: 15, marginBottom: 24,
                        background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: 8, padding: '8px 16px', display: 'inline-block'
                    }}>
                        {sentTo}
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                        Click the link in the email to activate your account and start using Stalk.ai.
                        Check your spam folder if you don&apos;t see it.
                    </p>
                </div>
            </div>
        )
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
                    <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 14 }}>Start monitoring for free</p>
                </div>

                <div className="card" style={{ padding: 32, borderRadius: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
                        <Sparkles size={18} color="var(--accent-bright)" />
                        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Create your account</h1>
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
                                    placeholder="Min 6 characters"
                                    required
                                    minLength={6}
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
                            {loading ? 'Creating account...' : <><span>Create free account</span> <ArrowRight size={15} /></>}
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 12 }}>
                        By signing up you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>

                <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-muted)', fontSize: 14 }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: 'var(--accent-bright)', textDecoration: 'none', fontWeight: 600 }}>
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}
