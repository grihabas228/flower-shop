'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, CheckCircle } from 'lucide-react'

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-[#b5c7a3]/30 bg-[#b5c7a3]/5 p-8 text-center">
        <CheckCircle className="h-10 w-10 text-[#b5c7a3] mx-auto mb-3" />
        <p className="font-sans font-medium text-[#2d2d2d] mb-1">Сообщение отправлено</p>
        <p className="font-sans text-sm text-[#8a8a8a]">
          Мы свяжемся с вами в ближайшее время
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 text-sm text-[#e8b4b8] hover:text-[#d4949a] transition-colors cursor-pointer"
        >
          Отправить ещё
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm text-[#5a5a5a] font-sans mb-1.5">
          Имя
        </label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Ваше имя"
          className="bg-white border-[#e8e4de] focus-visible:border-[#e8b4b8] focus-visible:ring-[#e8b4b8]/20 h-11"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm text-[#5a5a5a] font-sans mb-1.5">
          Телефон
        </label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="+7 (___) ___-__-__"
          className="bg-white border-[#e8e4de] focus-visible:border-[#e8b4b8] focus-visible:ring-[#e8b4b8]/20 h-11"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm text-[#5a5a5a] font-sans mb-1.5">
          Сообщение
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Ваш вопрос или пожелание..."
          className="w-full rounded-md border border-[#e8e4de] bg-white px-3 py-2 text-sm text-[#2d2d2d] placeholder:text-[#c9c4be] focus-visible:outline-none focus-visible:border-[#e8b4b8] focus-visible:ring-[3px] focus-visible:ring-[#e8b4b8]/20 transition-shadow resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#e8b4b8] hover:bg-[#d4949a] text-white h-11 gap-2"
      >
        {loading ? (
          <span className="animate-pulse">Отправка...</span>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Отправить
          </>
        )}
      </Button>
    </form>
  )
}
