'use client'

import CallGuardClient from './CallGuardClient'
import NavBar from '../components/home/NavBar'
import { useEffect } from 'react'

export default function CallGuardPage() {
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callguard/page.tsx:10',message:'CallGuardPage component mounted',data:{pathname:window.location.pathname,hasNavBar:!!NavBar,hasCallGuardClient:!!CallGuardClient},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }, []);
  // #endregion
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'callguard/page.tsx:15',message:'CallGuardPage render start',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CallGuard</h1>
          <p className="text-xl text-gray-600">Live coaching for suspicious calls</p>
        </div>
        <CallGuardClient />
      </main>
    </div>
  )
}

