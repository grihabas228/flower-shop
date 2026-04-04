import { getCachedGlobal } from '@/utilities/getGlobals'

import { HeaderClient } from './index.client'

export async function Header() {
  const header = await getCachedGlobal('header', 1)()

  return <HeaderClient header={header} />
}
