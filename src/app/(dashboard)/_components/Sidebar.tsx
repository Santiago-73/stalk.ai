'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Eye, LayoutDashboard, FileText, Settings, LogOut, Building2 } from 'lucide-react'
import { logout } from '@/app/(auth)/actions'

const navItems = [
    { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { href: '/dashboard/subjects', icon: <Building2 size={18} />, label: 'Subjects' },
    { href: '/dashboard/digests', icon: <FileText size={18} />, label: 'Digests' },
    { href: '/settings', icon: <Settings size={18} />, label: 'Settings' },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="sidebar-aside" style={{
                width: 230, minHeight: '100vh', background: 'var(--bg-secondary)',
                borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                padding: '24px 16px', position: 'fixed', left: 0, top: 0, zIndex: 50
            }}>
                {/* Logo */}
                <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #7c3aed, #e879f9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Eye size={16} color="white" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                        Stalk<span style={{ color: 'var(--accent-bright)' }}>.ai</span>
                    </span>
                </Link>

                {/* Nav */}
                <nav style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10, paddingLeft: 12 }}>
                        Menu
                    </div>
                    {navItems.map(item => {
                        const active = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                                    borderRadius: 8, marginBottom: 2, textDecoration: 'none',
                                    background: active ? 'rgba(124,58,237,0.2)' : 'transparent',
                                    border: active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                                    color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
                                    fontWeight: active ? 600 : 400, fontSize: 14,
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <form action={logout}>
                    <button type="submit" style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                        borderRadius: 8, width: '100%', background: 'none', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14,
                        transition: 'color 0.15s'
                    }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                        <LogOut size={18} /> Log out
                    </button>
                </form>
            </aside>

            {/* Mobile bottom nav */}
            <nav className="mobile-nav">
                {navItems.map(item => {
                    const active = item.href === '/dashboard'
                        ? pathname === '/dashboard'
                        : pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center',
                                gap: 3, padding: '8px 12px', borderRadius: 10, textDecoration: 'none',
                                color: active ? 'var(--accent-bright)' : 'var(--text-muted)',
                                fontSize: 10, fontWeight: active ? 700 : 400,
                                background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                                flex: 1,
                            }}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
                <form action={logout} style={{ flex: 1, display: 'flex' }}>
                    <button type="submit" style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 3, padding: '8px 12px', borderRadius: 10, width: '100%',
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: 10,
                    }}>
                        <LogOut size={18} />
                        <span>Log out</span>
                    </button>
                </form>
            </nav>
        </>
    )
}
