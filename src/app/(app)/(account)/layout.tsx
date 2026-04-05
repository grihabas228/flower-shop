import type { ReactNode } from 'react'

import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { RenderParams } from '@/components/RenderParams'

export default async function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[60vh]">
      <div className="container">
        <RenderParams className="" />
      </div>
      {children}
    </div>
  )
}
