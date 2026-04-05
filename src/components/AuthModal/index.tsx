'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [phone, setPhone] = useState('')
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [agreedNewsletter, setAgreedNewsletter] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose()
    },
    [onClose],
  )

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '')
    const d = digits.startsWith('7') ? digits.slice(1) : digits.startsWith('8') ? digits.slice(1) : digits

    let formatted = '+7'
    if (d.length > 0) formatted += ' (' + d.slice(0, 3)
    if (d.length >= 3) formatted += ') '
    if (d.length > 3) formatted += d.slice(3, 6)
    if (d.length > 6) formatted += '-' + d.slice(6, 8)
    if (d.length > 8) formatted += '-' + d.slice(8, 10)

    return formatted
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    if (raw.length < 3) {
      setPhone('+7 ')
      return
    }
    setPhone(formatPhone(raw))
  }

  const handlePhoneFocus = () => {
    if (!phone) setPhone('+7 ')
  }

  const phoneDigits = phone.replace(/\D/g, '')
  const isPhoneValid = phoneDigits.length === 11
  const canSubmit = isPhoneValid && agreedPrivacy

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    // For now, just navigate to checkout — SMS auth will be implemented later
    onClose()
    router.push('/checkout')
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 md:p-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <h2 className="font-serif text-2xl md:text-3xl text-foreground mb-2">
          Вход в личный кабинет
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Мы привяжем ваш номер к заказу и точно ничего не потеряем
        </p>

        <form onSubmit={handleSubmit}>
          {/* Phone input */}
          <div className="mb-6">
            <label className="block text-[11px] tracking-[0.12em] uppercase text-muted-foreground mb-2 font-medium">
              Введите номер телефона
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                onFocus={handlePhoneFocus}
                placeholder="+7 (___) ___-__-__"
                className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-base placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all font-sans"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] tracking-[0.1em] uppercase text-muted-foreground/60 pointer-events-none sr-only">
                Ваш телефон
              </span>
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-4 mb-8">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedPrivacy}
                  onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border-2 border-border peer-checked:border-accent peer-checked:bg-accent transition-colors flex items-center justify-center">
                  {agreedPrivacy && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground leading-snug">
                Соглашаюсь с{' '}
                <Link href="/privacy" className="text-accent underline underline-offset-2 hover:text-accent/80">
                  политикой конфиденциальности
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedNewsletter}
                  onChange={(e) => setAgreedNewsletter(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-5 h-5 rounded-md border-2 border-border peer-checked:border-accent peer-checked:bg-accent transition-colors flex items-center justify-center">
                  {agreedNewsletter && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground leading-snug">
                Соглашаюсь на получение рассылок
              </span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full bg-accent text-accent-foreground py-3.5 rounded-full text-sm font-medium tracking-wide hover:bg-accent/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98]"
          >
            Получить код
          </button>
        </form>
      </div>
    </div>
  )
}
