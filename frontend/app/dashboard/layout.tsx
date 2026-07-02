'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import DashboardShell from '../components/dashboard/DashboardShell'
import NavBar from '../components/home/NavBar'

function isLessonRoute(pathname: string) {
  return pathname.startsWith('/dashboard/lessons')
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const onLessonRoute = isLessonRoute(pathname)

  useEffect(() => {
    if (!loading && !isAuthenticated && !onLessonRoute) {
      const next = encodeURIComponent(pathname)
      router.replace(`/login?next=${next}`)
    }
  }, [loading, isAuthenticated, pathname, router, onLessonRoute])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (onLessonRoute) {
      return (
        <div className="min-h-screen bg-gray-50">
          <NavBar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Redirecting to login...</div>
      </div>
    )
  }

  return <DashboardShell>{children}</DashboardShell>
}
