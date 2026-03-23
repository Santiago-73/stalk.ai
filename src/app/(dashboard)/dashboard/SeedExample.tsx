'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function SeedExample({ shouldSeed }: { shouldSeed: boolean }) {
    const router = useRouter()
    const called = useRef(false)

    useEffect(() => {
        if (!shouldSeed || called.current) return
        called.current = true

        fetch('/api/seed-example', { method: 'POST' })
            .then(r => r.json())
            .then(data => { if (data.created) router.refresh() })
            .catch(() => {})
    }, [shouldSeed, router])

    return null
}
