import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: new Headers(await headers()),
  })

  if (!session) {
    redirect('/sign-in')
  }

  return <>{children}</>
}
