'use client'

import { type ReactNode } from 'react'

export default function PricingLink({
  className,
  style,
  children,
}: {
  className?: string
  style?: React.CSSProperties
  children: ReactNode
}) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Update hash without triggering default jump
    history.replaceState(null, '', '#pricing')
  }

  return (
    <a href="#pricing" onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  )
}
