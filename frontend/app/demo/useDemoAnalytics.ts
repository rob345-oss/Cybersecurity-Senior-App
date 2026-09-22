/**
 * Optional privacy-safe demo event hooks.
 * No analytics SDK is installed — these are no-ops that can be wired later
 * without tracking transcript content or personal information.
 */

export type DemoAnalyticsEvent =
  | 'demo_opened'
  | 'demo_started'
  | 'scenario_completed'
  | 'dashboard_explored'
  | 'demo_exited'

export function trackDemoEvent(event: DemoAnalyticsEvent): void {
  if (typeof window === 'undefined') return
  // Intentionally local-only. Do not send transcript text or PII.
  if (process.env.NODE_ENV === 'development') {
    console.debug('[demo-analytics]', event)
  }
}
