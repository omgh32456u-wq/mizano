import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Radio-style option tile. Labels wrap instead of truncating, and `min-w-0` lets grid cells shrink without overflow. */
export function Choice({ active, className, ...props }: ComponentProps<'button'> & { active: boolean }) {
  return <button type="button" role="radio" aria-checked={active} className={cn('ob-choice', className)} {...props} />
}
