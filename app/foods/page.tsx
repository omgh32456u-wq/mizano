import type { Metadata } from 'next'
import { FoodsScreen } from '@/components/foods/foods-screen'

export const metadata: Metadata = { title: 'Foods · Mizano' }

export default function FoodsPage() {
  return <FoodsScreen />
}
