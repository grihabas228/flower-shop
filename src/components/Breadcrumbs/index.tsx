import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      className={`mb-6 flex items-center gap-1.5 font-sans text-[13px] text-[#8a8a8a] ${className ?? ''}`}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight className="h-3 w-3" strokeWidth={1.5} />}
            {isLast || !item.href ? (
              <span className="text-[#2d2d2d]">{item.label}</span>
            ) : (
              <Link href={item.href} className="transition-colors hover:text-[#2d2d2d]">
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
