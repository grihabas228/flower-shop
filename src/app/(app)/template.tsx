'use client'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-[fadeIn_0.15s_ease-out]">
      {children}
    </div>
  )
}
