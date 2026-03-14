import Sidebar from './_components/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <Sidebar />
            <main className="dashboard-main">
                {children}
            </main>
        </div>
    )
}
