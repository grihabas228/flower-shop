'use client'

import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Placeholder ConfirmOrder — will be updated when ЮKassa is integrated.
 * Currently redirects to home since no payment provider is active.
 */
export const ConfirmOrder: React.FC = () => {
  const router = useRouter()

  useEffect(() => {
    // No payment provider configured yet — redirect to home
    router.push('/')
  }, [router])

  return (
    <div className="text-center w-full flex flex-col items-center justify-start gap-4">
      <h1 className="text-2xl">Подтверждение заказа</h1>
      <LoadingSpinner className="w-12 h-6" />
    </div>
  )
}
