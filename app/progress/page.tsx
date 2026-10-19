import type { Metadata } from 'next'
import { ProgressScreen } from '@/components/progress/progress-screen'

export const metadata: Metadata = { title: 'Progress · Mizano' }

export default function ProgressPage() {
  return <ProgressScreen />
}
