import { ShoppingBag } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: {
  className?: string
  quantity?: number
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="relative p-2 text-[#2d2d2d] transition-colors hover:text-[#5a5a5a]"
      aria-label="Корзина"
      {...rest}
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
      {quantity ? (
        <span className="absolute -right-0 -top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#e8b4b8] text-[10px] font-medium text-white">
          {quantity}
        </span>
      ) : null}
    </button>
  )
}
