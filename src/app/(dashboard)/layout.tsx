import Sidebar from './_components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Sidebar />
            <main style={{ marginLeft: 230, flex: 1, padding: '40px', maxWidth: 'calc(100vw - 230px)' }}>
                {children}
            </main>
        </div>
    )
}
