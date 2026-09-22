'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Check,
  ChevronRight,
  Loader2,
  Phone,
  Shield,
  Smartphone,
  Users,
  X,
} from 'lucide-react'
import DashboardHeader from '../../components/dashboard/DashboardHeader'
import {
  Contact,
  ContactsStatus,
  DuplicatePair,
  RELATIONSHIP_OPTIONS,
  addManualTrusted,
  bulkTrust,
  contactInitials,
  deleteContactData,
  disconnectGoogle,
  formatLastSynced,
  getContactsStatus,
  importVcard,
  listContacts,
  listDuplicates,
  mergeDuplicate,
  startGoogleConnect,
  syncGoogleContacts,
  trustContact,
  untrustContact,
  updateContact,
} from '../../contacts/api'

type Toast = { type: 'success' | 'error' | 'info'; message: string } | null

export default function ContactsPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<ContactsStatus | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [total, setTotal] = useState(0)
  const [trustedCount, setTrustedCount] = useState(0)
  const [query, setQuery] = useState('')
  const [relationshipFilter, setRelationshipFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(1)
  const [showIphoneGuide, setShowIphoneGuide] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [showVcard, setShowVcard] = useState(false)
  const [showIcloudHelp, setShowIcloudHelp] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showBulkConfirm, setShowBulkConfirm] = useState(false)
  const [detail, setDetail] = useState<Contact | null>(null)
  const [duplicates, setDuplicates] = useState<DuplicatePair[]>([])
  const [manualForm, setManualForm] = useState({
    name: '',
    phone: '',
    relationship: 'Family',
    notes: '',
  })
  const [vcardPreview, setVcardPreview] = useState<Record<string, unknown> | null>(null)
  const [vcardFile, setVcardFile] = useState<File | null>(null)

  const showMessage = useCallback((type: Toast extends null ? never : NonNullable<Toast>['type'], message: string) => {
    setToast({ type, message })
    window.setTimeout(() => setToast(null), 5000)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [st, list, dups] = await Promise.all([
        getContactsStatus(),
        listContacts({
          q: query || undefined,
          relationship: relationshipFilter || undefined,
          page_size: 100,
        }),
        listDuplicates().catch(() => ({ duplicates: [] as DuplicatePair[], message: '' })),
      ])
      setStatus(st)
      setContacts(list.contacts)
      setTotal(list.total)
      setTrustedCount(list.trusted_count)
      setDuplicates(dups.duplicates || [])
      if (!st.connected && st.trusted_count === 0 && list.total === 0) {
        const seen = typeof window !== 'undefined' && sessionStorage.getItem('tg_contacts_onboarded')
        if (!seen || searchParams.get('onboarding') === '1') {
          setShowOnboarding(true)
        }
      }
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [query, relationshipFilter, searchParams, showMessage])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (searchParams.get('connected') === '1') {
      showMessage('success', 'Your Google Contacts are connected.')
      void refresh()
    }
    if (searchParams.get('error') === '1') {
      showMessage(
        'error',
        searchParams.get('message') ||
          'We couldn’t connect Google Contacts. You can try again whenever you are ready.'
      )
    }
    if (searchParams.get('sync_warning') === '1') {
      showMessage(
        'info',
        'Your Google account is connected, but we couldn’t update contacts yet. Try “Sync Contacts”.'
      )
    }
  }, [searchParams, showMessage, refresh])

  const connected = status?.connected === true
  const needsReconnect = status?.status === 'needs_reconnect'

  const handleConnectGoogle = async () => {
    setBusy(true)
    try {
      const { authorize_url } = await startGoogleConnect()
      window.location.href = authorize_url
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Could not connect.')
      setBusy(false)
    }
  }

  const handleSync = async () => {
    setBusy(true)
    try {
      const result = await syncGoogleContacts()
      showMessage('success', result.message || 'Your contacts were updated.')
      await refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Sync failed.')
    } finally {
      setBusy(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(contacts.map((c) => c.id)))
  const deselectAll = () => setSelected(new Set())

  const toggleTrust = async (contact: Contact) => {
    setBusy(true)
    try {
      if (contact.is_trusted) {
        await untrustContact(contact.id)
        showMessage('success', `${contact.display_name} was removed from Trusted Callers.`)
      } else {
        await trustContact(contact.id, {
          relationship: contact.relationship || undefined,
        })
        showMessage('success', `${contact.display_name} is now a trusted caller.`)
      }
      await refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Could not update trust.')
    } finally {
      setBusy(false)
    }
  }

  const handleBulkAdd = async () => {
    setBusy(true)
    try {
      const result = await bulkTrust({
        contact_ids: Array.from(selected),
        action: 'add',
      })
      showMessage('success', result.message || `${result.count} trusted callers added.`)
      setSelected(new Set())
      setShowBulkConfirm(false)
      await refresh()
      if (showOnboarding) {
        setOnboardingStep(4)
      }
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Bulk update failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleBulkRemove = async () => {
    if (
      !window.confirm(
        `Remove ${selected.size} people from Trusted Callers? They will no longer be recognized as people you trust.`
      )
    ) {
      return
    }
    setBusy(true)
    try {
      const result = await bulkTrust({
        contact_ids: Array.from(selected),
        action: 'remove',
      })
      showMessage('success', result.message)
      setSelected(new Set())
      await refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Bulk update failed.')
    } finally {
      setBusy(false)
    }
  }

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await addManualTrusted(manualForm)
      showMessage('success', 'Trusted caller added.')
      setShowManual(false)
      setManualForm({ name: '', phone: '', relationship: 'Family', notes: '' })
      await refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Could not add caller.')
    } finally {
      setBusy(false)
    }
  }

  const handleVcardPreview = async (file: File) => {
    setBusy(true)
    setVcardFile(file)
    try {
      const preview = await importVcard(file, false)
      setVcardPreview(preview)
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Invalid contacts file.')
      setVcardPreview(null)
    } finally {
      setBusy(false)
    }
  }

  const handleVcardImport = async () => {
    if (!vcardFile) return
    setBusy(true)
    try {
      const result = await importVcard(vcardFile, true)
      showMessage(
        'success',
        `Imported ${String(result.imported ?? 0)} contacts. Choose who to trust next.`
      )
      setShowVcard(false)
      setVcardPreview(null)
      setVcardFile(null)
      await refresh()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  const finishOnboarding = () => {
    sessionStorage.setItem('tg_contacts_onboarded', '1')
    setShowOnboarding(false)
  }

  const emptyTrusted = trustedCount === 0 && !loading

  const statusItems = useMemo(
    () => [
      {
        label: 'Google Contacts',
        value: connected ? 'Connected' : needsReconnect ? 'Please reconnect' : 'Not connected',
        ok: connected,
      },
      {
        label: 'Titanium Guardian',
        value:
          total > 0
            ? `${total} contact${total === 1 ? '' : 's'} imported`
            : 'No contacts imported yet',
        ok: total > 0,
      },
      {
        label: 'Trusted Callers',
        value:
          trustedCount > 0
            ? `${trustedCount} people protected`
            : 'None selected yet',
        ok: trustedCount > 0,
      },
      {
        label: 'iPhone Contacts',
        value: 'Setup instructions',
        ok: false,
        action: () => setShowIphoneGuide(true),
      },
    ],
    [connected, needsReconnect, total, trustedCount]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-600">
        <Loader2 className="h-8 w-8 animate-spin mr-3" />
        Loading your contacts…
      </div>
    )
  }

  return (
    <>
      <DashboardHeader
        title="Contacts & Trusted Callers"
        description="Protect calls from people you know."
      />

      {toast && (
        <div
          className={`mb-6 rounded-xl border px-5 py-4 text-base ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-900'
              : toast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      <p className="text-lg text-gray-700 mb-8 max-w-3xl leading-relaxed">
        Titanium Guardian can securely connect to your Google Contacts. You choose which people
        are trusted. When one of those people calls, Titanium Guardian can recognize them as
        someone you know.
      </p>

      {/* Status strip */}
      <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className={`text-left bg-white rounded-xl border border-gray-200 p-5 ${
              item.action ? 'hover:border-gray-400 cursor-pointer' : 'cursor-default'
            }`}
          >
            <p className="text-sm text-gray-500 mb-2">{item.label}</p>
            <p className="text-lg font-semibold text-gray-900 flex items-start gap-2">
              {item.ok ? (
                <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" aria-hidden />
              ) : null}
              <span>{item.value}</span>
            </p>
          </button>
        ))}
      </section>

      {/* Empty state */}
      {emptyTrusted && !connected && (
        <section className="mb-10 bg-white rounded-xl border border-gray-200 p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Add the people you know.</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl">
            Trusted Callers helps Titanium Guardian recognize family, friends, caregivers,
            doctors, and other people you trust.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={busy}
              className="min-h-[56px] px-8 py-4 rounded-xl bg-gray-900 text-white text-lg font-semibold hover:bg-gray-800 disabled:opacity-60"
            >
              Connect Google Contacts
            </button>
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="min-h-[56px] px-8 py-4 rounded-xl border-2 border-gray-300 text-gray-900 text-lg font-semibold hover:border-gray-500"
            >
              Add Someone Manually
            </button>
          </div>
          <p className="mt-4 text-base text-gray-500">
            We will only access your contacts after you give permission.
          </p>
          <button
            type="button"
            className="mt-3 text-base text-gray-700 underline"
            onClick={() => setShowPrivacy(true)}
          >
            Learn how your contacts are used
          </button>
        </section>
      )}

      {/* Google connection card */}
      {(connected || needsReconnect || total > 0) && (
        <section className="mb-8 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Google Contacts</h2>
              {connected ? (
                <>
                  <p className="text-base text-gray-600">
                    <span className="text-green-700 font-medium">Connected</span>
                    {status?.account_email ? ` · ${status.account_email}` : ''}
                  </p>
                  <p className="text-base text-gray-600 mt-1">
                    Last updated: {formatLastSynced(status?.last_synced_at)}
                  </p>
                  <p className="text-base text-gray-600">{total} contacts</p>
                </>
              ) : needsReconnect ? (
                <p className="text-base text-amber-800">
                  Please reconnect your Google account so Titanium Guardian can update your
                  contacts.
                </p>
              ) : (
                <p className="text-base text-gray-600">Not connected</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {!connected || needsReconnect ? (
                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={busy}
                  className="min-h-[52px] px-6 py-3 rounded-xl bg-gray-900 text-white text-base font-semibold"
                >
                  {needsReconnect ? 'Reconnect Google Contacts' : 'Connect Google Contacts'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={busy}
                  className="min-h-[52px] px-6 py-3 rounded-xl bg-gray-900 text-white text-base font-semibold disabled:opacity-60"
                >
                  Sync Contacts
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowIphoneGuide(true)}
                className="min-h-[52px] px-6 py-3 rounded-xl border-2 border-gray-300 text-base font-semibold"
              >
                Want the same contacts on your iPhone?
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Your contacts belong to you. Titanium Guardian uses contact information only to
            provide features you choose, such as recognizing trusted callers.{' '}
            <button type="button" className="underline" onClick={() => setShowPrivacy(true)}>
              Learn how your contacts are used
            </button>
          </p>
        </section>
      )}

      {/* Trusted summary */}
      <section className="mb-8 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Trusted Callers</h2>
            <p className="text-lg text-gray-600 mt-1">
              {trustedCount > 0
                ? `${trustedCount} people protected`
                : 'No trusted callers yet — choose people below.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowManual(true)}
              className="min-h-[48px] px-5 py-3 rounded-xl border-2 border-gray-300 font-semibold"
            >
              Add Someone Manually
            </button>
            <button
              type="button"
              onClick={() => setShowVcard(true)}
              className="min-h-[48px] px-5 py-3 rounded-xl border-2 border-gray-300 font-semibold"
            >
              Import Contacts File
            </button>
          </div>
        </div>
      </section>

      {/* Deleted Google contact warnings */}
      {contacts.some((c) => c.source_contact_deleted && c.is_trusted) && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
          <p className="font-semibold text-lg">A trusted contact may have been removed from Google</p>
          <p className="mt-1 text-base">
            We kept their Trusted Caller protection. Review the highlighted people below so you
            stay protected.
          </p>
        </div>
      )}

      {/* Duplicates */}
      {duplicates.length > 0 && (
        <section className="mb-8 bg-white rounded-xl border border-amber-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">We found possible duplicates.</h2>
          <p className="text-base text-gray-600 mb-4">
            Review each pair. We will never merge contacts unless you choose to.
          </p>
          <ul className="space-y-4">
            {duplicates.map((dup) => (
              <li
                key={dup.id}
                className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  <div>
                    <p className="font-semibold text-lg">{dup.contact_a.display_name}</p>
                    <p className="text-gray-600">{dup.contact_a.primary_phone || 'No phone'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{dup.contact_b.display_name}</p>
                    <p className="text-gray-600">{dup.contact_b.primary_phone || 'No phone'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="min-h-[48px] px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold"
                    onClick={async () => {
                      setBusy(true)
                      try {
                        await mergeDuplicate(dup.id, dup.contact_a.id)
                        showMessage('success', 'Contacts merged.')
                        await refresh()
                      } catch (err) {
                        showMessage('error', err instanceof Error ? err.message : 'Merge failed.')
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Keep first & Merge
                  </button>
                  <button
                    type="button"
                    className="min-h-[48px] px-4 py-2 rounded-xl border-2 border-gray-300 font-semibold"
                    onClick={async () => {
                      setBusy(true)
                      try {
                        await mergeDuplicate(dup.id, dup.contact_b.id)
                        showMessage('success', 'Contacts merged.')
                        await refresh()
                      } catch (err) {
                        showMessage('error', err instanceof Error ? err.message : 'Merge failed.')
                      } finally {
                        setBusy(false)
                      }
                    }}
                  >
                    Keep second & Merge
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contact list */}
      {(connected || total > 0) && (
        <section className="mb-12 bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="contact-search" className="block text-base font-medium text-gray-800 mb-2">
                Search contacts
              </label>
              <input
                id="contact-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, phone, email, or relationship"
                className="w-full min-h-[52px] rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-gray-900 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="rel-filter" className="block text-base font-medium text-gray-800 mb-2">
                Filter by relationship
              </label>
              <select
                id="rel-filter"
                value={relationshipFilter}
                onChange={(e) => setRelationshipFilter(e.target.value)}
                className="min-h-[52px] rounded-xl border-2 border-gray-300 px-4 text-lg"
              >
                <option value="">Everyone</option>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              type="button"
              onClick={selectAll}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 font-medium"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 font-medium"
            >
              Deselect All
            </button>
            <button
              type="button"
              disabled={selected.size === 0 || busy}
              onClick={() => setShowBulkConfirm(true)}
              className="min-h-[44px] px-4 py-2 rounded-lg bg-gray-900 text-white font-semibold disabled:opacity-50"
            >
              Add Selected to Trusted Callers
            </button>
            <button
              type="button"
              disabled={selected.size === 0 || busy}
              onClick={handleBulkRemove}
              className="min-h-[44px] px-4 py-2 rounded-lg border-2 border-red-300 text-red-800 font-semibold disabled:opacity-50"
            >
              Remove Selected from Trusted Callers
            </button>
          </div>

          {contacts.length === 0 ? (
            <p className="text-lg text-gray-600 py-8">
              {query
                ? 'No contacts match your search.'
                : 'We couldn’t find any contacts with phone numbers yet. Try Sync Contacts, or add someone manually.'}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <li
                  key={contact.id}
                  className={`py-5 flex flex-col sm:flex-row sm:items-center gap-4 ${
                    contact.source_contact_deleted ? 'bg-amber-50 -mx-2 px-2 rounded-lg' : ''
                  }`}
                >
                  <label className="flex items-center gap-4 flex-1 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="h-6 w-6 rounded border-gray-400"
                      aria-label={`Select ${contact.display_name}`}
                    />
                    <button
                      type="button"
                      onClick={() => setDetail(contact)}
                      className="flex items-center gap-4 text-left min-w-0 flex-1"
                    >
                      {contact.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={contact.photo_url}
                          alt=""
                          className="h-14 w-14 rounded-full object-cover shrink-0 bg-gray-100"
                        />
                      ) : (
                        <span className="h-14 w-14 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-lg font-semibold shrink-0">
                          {contactInitials(contact.display_name)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block text-xl font-semibold text-gray-900 truncate">
                          {contact.display_name}
                        </span>
                        <span className="block text-base text-gray-600">
                          {contact.primary_phone || 'No phone number'}
                        </span>
                        {contact.relationship && (
                          <span className="block text-base text-gray-500 mt-0.5">
                            {contact.relationship}
                          </span>
                        )}
                        {contact.source_contact_deleted && (
                          <span className="block text-sm text-amber-800 mt-1">
                            Missing from Google — still protected if trusted
                          </span>
                        )}
                      </span>
                    </button>
                  </label>
                  <button
                    type="button"
                    onClick={() => void toggleTrust(contact)}
                    disabled={busy || !contact.normalized_phone}
                    className={`min-h-[52px] min-w-[140px] px-5 py-3 rounded-xl text-base font-semibold border-2 ${
                      contact.is_trusted
                        ? 'bg-green-50 border-green-600 text-green-900'
                        : 'bg-white border-gray-300 text-gray-900'
                    } disabled:opacity-50`}
                  >
                    {contact.is_trusted ? '✓ Trusted' : 'Not Trusted'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* How does this work */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How does this work?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Your contacts stay familiar',
              body: 'You keep the names and phone numbers you already know.',
              icon: Users,
            },
            {
              title: 'You choose who you trust',
              body: 'Choose family, friends, doctors, caregivers, and anyone else you know.',
              icon: Shield,
            },
            {
              title: 'Titanium Guardian recognizes them',
              body: 'When someone on your trusted list calls, Titanium Guardian knows the number belongs to someone you recognize.',
              icon: Phone,
            },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="bg-white rounded-xl border border-gray-200 p-6 md:p-8"
              >
                <Icon className="h-10 w-10 text-gray-700 mb-4" aria-hidden />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{card.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{card.body}</p>
              </div>
            )
          })}
        </div>
        <p className="mt-6 text-lg text-gray-700 max-w-3xl">
          You are always in control. Titanium Guardian will never add someone as trusted without
          your permission.
        </p>
        <p className="mt-3 text-base text-gray-500 max-w-3xl">
          Google keeps your contact list. Titanium Guardian knows which people you trust. Your
          iPhone can show those same Google contacts.
        </p>
      </section>

      {/* iPhone section teaser */}
      <section className="mb-12 bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl border border-gray-200 p-6 md:p-10">
        <div className="flex items-start gap-4 mb-4">
          <Smartphone className="h-10 w-10 text-gray-800 shrink-0" aria-hidden />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Use the same contacts on your iPhone
            </h2>
            <p className="text-lg text-gray-700 mt-2">
              Your iPhone can show your Google Contacts inside the Apple Contacts app.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowIphoneGuide(true)}
          className="min-h-[52px] px-6 py-3 rounded-xl bg-gray-900 text-white text-lg font-semibold inline-flex items-center gap-2"
        >
          Show Me How <ChevronRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowIcloudHelp(true)}
          className="ml-0 mt-3 sm:mt-0 sm:ml-4 text-base text-gray-700 underline"
        >
          Have contacts only in iCloud?
        </button>
      </section>

      {/* Privacy controls */}
      <section className="mb-8 border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Privacy</h2>
        <p className="text-base text-gray-600 mb-4 max-w-2xl">
          Your contacts belong to you. You can disconnect Google or delete imported data at any
          time.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setShowPrivacy(true)}
            className="min-h-[48px] px-5 py-3 rounded-xl border-2 border-gray-300 font-semibold"
          >
            Learn how your contacts are used
          </button>
          {connected || needsReconnect ? (
            <button
              type="button"
              onClick={async () => {
                if (
                  !window.confirm(
                    'Disconnect Google Contacts? Your trusted callers stay protected unless you delete them separately.'
                  )
                ) {
                  return
                }
                setBusy(true)
                try {
                  const result = await disconnectGoogle()
                  showMessage('success', result.message)
                  await refresh()
                } catch (err) {
                  showMessage('error', err instanceof Error ? err.message : 'Disconnect failed.')
                } finally {
                  setBusy(false)
                }
              }}
              className="min-h-[48px] px-5 py-3 rounded-xl border-2 border-gray-300 font-semibold"
            >
              Disconnect Google Contacts
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="min-h-[48px] px-5 py-3 rounded-xl border-2 border-red-300 text-red-800 font-semibold"
          >
            Delete Imported Contact Data
          </button>
        </div>
      </section>

      {/* Modals */}
      {showBulkConfirm && (
        <Modal title="These people will be treated as trusted callers." onClose={() => setShowBulkConfirm(false)}>
          <p className="text-lg text-gray-700 mb-6">
            You selected {selected.size} {selected.size === 1 ? 'person' : 'people'}. Titanium
            Guardian will recognize their phone numbers as people you know.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleBulkAdd()}
            className="w-full min-h-[56px] rounded-xl bg-gray-900 text-white text-lg font-semibold"
          >
            Add to Trusted Callers
          </button>
        </Modal>
      )}

      {showManual && (
        <Modal title="Add Trusted Caller" onClose={() => setShowManual(false)}>
          <form onSubmit={handleManualAdd} className="space-y-4">
            <Field label="Name">
              <input
                required
                value={manualForm.name}
                onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                className="field-input"
              />
            </Field>
            <Field label="Phone number">
              <input
                required
                value={manualForm.phone}
                onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })}
                className="field-input"
                placeholder="+1 301 555 0192"
              />
            </Field>
            <Field label="Relationship">
              <select
                value={manualForm.relationship}
                onChange={(e) => setManualForm({ ...manualForm, relationship: e.target.value })}
                className="field-input"
              >
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Notes (optional)">
              <textarea
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                className="field-input min-h-[96px]"
              />
            </Field>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[56px] rounded-xl bg-gray-900 text-white text-lg font-semibold"
            >
              Add Trusted Caller
            </button>
          </form>
        </Modal>
      )}

      {showVcard && (
        <Modal title="Import Contacts File" onClose={() => { setShowVcard(false); setVcardPreview(null) }}>
          <p className="text-base text-gray-600 mb-4">
            Choose a .vcf contacts file. We will show a preview before importing. Imported
            contacts are not trusted until you choose them.
          </p>
          <input
            type="file"
            accept=".vcf,.vcard,text/vcard,text/x-vcard"
            className="mb-4 block w-full text-base"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void handleVcardPreview(file)
            }}
          />
          {vcardPreview && (
            <div className="mb-4 rounded-lg border border-gray-200 p-4">
              <p className="font-semibold text-lg mb-2">
                Preview: {String(vcardPreview.count ?? 0)} contacts
                {vcardPreview.with_phone != null
                  ? ` (${String(vcardPreview.with_phone)} with phone numbers)`
                  : ''}
              </p>
              <ul className="max-h-48 overflow-y-auto space-y-2 text-base text-gray-700">
                {((vcardPreview.contacts as Array<{ display_name: string; primary_phone?: string }>) || [])
                  .slice(0, 20)
                  .map((c, i) => (
                    <li key={i}>
                      {c.display_name} — {c.primary_phone || 'No phone'}
                    </li>
                  ))}
              </ul>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleVcardImport()}
                className="mt-4 w-full min-h-[52px] rounded-xl bg-gray-900 text-white font-semibold"
              >
                Import these contacts
              </button>
            </div>
          )}
        </Modal>
      )}

      {showPrivacy && (
        <Modal title="How your contacts are used" onClose={() => setShowPrivacy(false)}>
          <div className="space-y-4 text-base text-gray-700 leading-relaxed">
            <p>
              <strong>What we retrieve:</strong> names, phone numbers, email addresses, and photos
              from contacts you allow Titanium Guardian to see.
            </p>
            <p>
              <strong>Why:</strong> so you can choose Trusted Callers and so CallGuard can
              recognize those numbers when they call.
            </p>
            <p>
              <strong>How it is stored:</strong> on Titanium Guardian’s secure servers, with
              sensitive credentials encrypted.
            </p>
            <p>
              <strong>Sharing:</strong> we do not sell your contacts. Contact data is not shared
              with other users.
            </p>
            <p>
              <strong>Disconnect:</strong> use “Disconnect Google Contacts” to stop new updates.
              Your trusted callers stay protected unless you delete them.
            </p>
            <p>
              <strong>Delete:</strong> use “Delete Imported Contact Data” to remove imported
              contacts. You will see what will happen before anything is deleted.
            </p>
          </div>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal title="Delete imported contact data?" onClose={() => setShowDeleteConfirm(false)}>
          <p className="text-lg text-gray-700 mb-4">
            This permanently removes imported contacts from Titanium Guardian.
          </p>
          <p className="text-base text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            If you also remove trusted callers, Titanium Guardian will no longer recognize those
            phone numbers as people you trust.
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                try {
                  const result = await deleteContactData({
                    confirm: true,
                    remove_trusted_callers: false,
                  })
                  showMessage('success', result.message)
                  setShowDeleteConfirm(false)
                  await refresh()
                } catch (err) {
                  showMessage('error', err instanceof Error ? err.message : 'Delete failed.')
                } finally {
                  setBusy(false)
                }
              }}
              className="min-h-[52px] rounded-xl border-2 border-gray-300 font-semibold"
            >
              Delete imports, keep Trusted Callers
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (
                  !window.confirm(
                    'This will also remove Trusted Caller protection. Are you sure?'
                  )
                ) {
                  return
                }
                setBusy(true)
                try {
                  const result = await deleteContactData({
                    confirm: true,
                    remove_trusted_callers: true,
                  })
                  showMessage('success', result.message)
                  setShowDeleteConfirm(false)
                  await refresh()
                } catch (err) {
                  showMessage('error', err instanceof Error ? err.message : 'Delete failed.')
                } finally {
                  setBusy(false)
                }
              }}
              className="min-h-[52px] rounded-xl bg-red-700 text-white font-semibold"
            >
              Delete imports and Trusted Callers
            </button>
          </div>
        </Modal>
      )}

      {showIphoneGuide && <IphoneGuideModal onClose={() => setShowIphoneGuide(false)} />}
      {showIcloudHelp && (
        <IcloudHelpModal
          onClose={() => setShowIcloudHelp(false)}
          onImport={() => {
            setShowIcloudHelp(false)
            setShowVcard(true)
          }}
        />
      )}

      {detail && (
        <Modal title={detail.display_name} onClose={() => setDetail(null)}>
          <div className="space-y-3 text-base text-gray-700">
            {detail.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={detail.photo_url} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : null}
            <p>
              <strong>Phone:</strong> {detail.primary_phone || 'None'}
            </p>
            <p>
              <strong>Email:</strong> {detail.email || 'None'}
            </p>
            <p>
              <strong>Source:</strong>{' '}
              {detail.source === 'google'
                ? 'Google Contacts'
                : detail.source === 'imported_vcard'
                  ? 'Contacts file'
                  : 'Added manually'}
            </p>
            <p>
              <strong>Trusted:</strong> {detail.is_trusted ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Last synced:</strong> {formatLastSynced(detail.last_synced_at)}
            </p>
            <Field label="Relationship">
              <select
                value={detail.relationship || ''}
                onChange={async (e) => {
                  const value = e.target.value
                  try {
                    const updated = await updateContact(detail.id, { relationship: value })
                    setDetail(updated)
                    await refresh()
                  } catch (err) {
                    showMessage('error', err instanceof Error ? err.message : 'Update failed.')
                  }
                }}
                className="field-input"
              >
                <option value="">Not set</option>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
            <button
              type="button"
              onClick={() => void toggleTrust(detail)}
              className="w-full min-h-[52px] rounded-xl bg-gray-900 text-white font-semibold"
            >
              {detail.is_trusted ? 'Remove from Trusted Callers' : 'Mark as Trusted'}
            </button>
            <p className="text-sm text-gray-500">
              Changes here update Titanium Guardian only. They do not change your original Google
              contact.
            </p>
          </div>
        </Modal>
      )}

      {showOnboarding && (
        <OnboardingWizard
          step={onboardingStep}
          setStep={setOnboardingStep}
          onClose={finishOnboarding}
          onConnectGoogle={handleConnectGoogle}
          onShowAppleHelp={() => {
            setShowOnboarding(false)
            setShowIcloudHelp(true)
          }}
          onManual={() => {
            setShowOnboarding(false)
            setShowManual(true)
          }}
          onImport={() => {
            setShowOnboarding(false)
            setShowVcard(true)
          }}
          contacts={contacts}
          selected={selected}
          toggleSelect={toggleSelect}
          onConfirmTrusted={() => setShowBulkConfirm(true)}
          trustedCount={trustedCount}
        />
      )}

      <style jsx global>{`
        .field-input {
          width: 100%;
          min-height: 52px;
          border-radius: 0.75rem;
          border: 2px solid #d1d5db;
          padding: 0.75rem 1rem;
          font-size: 1.125rem;
        }
        .field-input:focus {
          outline: none;
          border-color: #111827;
        }
      `}</style>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-base font-medium text-gray-800 mb-2">{label}</span>
      {children}
    </label>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 md:p-8"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function IphoneGuideModal({ onClose }: { onClose: () => void }) {
  const steps = [
    'Connect Google Contacts to Titanium Guardian.',
    'On your iPhone, open Settings.',
    'Open: Apps → Contacts → Contacts Accounts (or Accounts → Add Account on older iPhones).',
    'Add or select your Google account.',
    'Turn on: Contacts.',
    'Your Google contacts will now appear inside the Contacts app on your iPhone.',
  ]
  return (
    <Modal title="Use the same contacts on your iPhone" onClose={onClose}>
      <p className="text-lg text-gray-700 mb-6">
        Your iPhone can show your Google Contacts inside the Apple Contacts app.
      </p>
      <ol className="space-y-4 mb-6">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold shrink-0">
              {i + 1}
            </span>
            <span className="text-lg text-gray-800 pt-1.5">
              <span className="font-semibold">STEP {i + 1}</span>
              <br />
              {step}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-base text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4">
        Titanium Guardian does not change your Apple account. Your iPhone simply shows the same
        Google contacts inside Apple’s Contacts app.
      </p>
    </Modal>
  )
}

function IcloudHelpModal({
  onClose,
  onImport,
}: {
  onClose: () => void
  onImport: () => void
}) {
  return (
    <Modal title="Have contacts only in iCloud?" onClose={onClose}>
      <p className="text-lg text-gray-700 mb-4">
        The easiest way to use Apple contacts with Titanium Guardian is to move or sync them with
        Google Contacts.
      </p>
      <ol className="list-decimal pl-6 space-y-2 text-base text-gray-700 mb-6">
        <li>Export contacts from iCloud as a vCard.</li>
        <li>Import the vCard into Google Contacts.</li>
        <li>Use Google Contacts’ duplicate tools if needed.</li>
        <li>Connect Google Contacts to Titanium Guardian.</li>
        <li>Enable Google Contacts on your iPhone.</li>
      </ol>
      <p className="text-base text-gray-600 mb-4">
        Titanium Guardian does not automatically migrate iCloud contacts. You can also import a
        contacts file here if you have a .vcf file.
      </p>
      <button
        type="button"
        onClick={onImport}
        className="w-full min-h-[52px] rounded-xl bg-gray-900 text-white font-semibold"
      >
        Import Contacts File
      </button>
    </Modal>
  )
}

function OnboardingWizard({
  step,
  setStep,
  onClose,
  onConnectGoogle,
  onShowAppleHelp,
  onManual,
  onImport,
  contacts,
  selected,
  toggleSelect,
  onConfirmTrusted,
  trustedCount,
}: {
  step: number
  setStep: (n: number) => void
  onClose: () => void
  onConnectGoogle: () => void
  onShowAppleHelp: () => void
  onManual: () => void
  onImport: () => void
  contacts: Contact[]
  selected: Set<string>
  toggleSelect: (id: string) => void
  onConfirmTrusted: () => void
  trustedCount: number
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 md:p-10">
        {step === 1 && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Let’s add the people you trust.
            </h2>
            <p className="text-lg text-gray-600 mb-8">This usually takes just a few minutes.</p>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full min-h-[56px] rounded-xl bg-gray-900 text-white text-lg font-semibold"
            >
              Continue
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Where are your contacts?</h2>
            <div className="space-y-3">
              <ChoiceButton onClick={onConnectGoogle}>Google Contacts</ChoiceButton>
              <ChoiceButton onClick={onShowAppleHelp}>Apple Contacts</ChoiceButton>
              <ChoiceButton onClick={onManual}>Enter them myself</ChoiceButton>
              <ChoiceButton onClick={onImport}>Import a Contacts File</ChoiceButton>
            </div>
            <button type="button" onClick={onClose} className="mt-6 text-base text-gray-500 underline">
              Skip for now
            </button>
          </>
        )}
        {step === 3 && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose people you trust.</h2>
            <p className="text-base text-gray-600 mb-4">
              Tap the people Titanium Guardian should recognize.
            </p>
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100 mb-6">
              {contacts.slice(0, 40).map((c) => (
                <li key={c.id} className="py-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-6 w-6"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                    <span>
                      <span className="block font-semibold text-lg">{c.display_name}</span>
                      <span className="text-gray-600">{c.primary_phone || 'No phone'}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={onConfirmTrusted}
              className="w-full min-h-[56px] rounded-xl bg-gray-900 text-white text-lg font-semibold disabled:opacity-50"
            >
              Add to Trusted Callers
            </button>
          </>
        )}
        {step === 4 && (
          <>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">You’re protected.</h2>
            <p className="text-lg text-gray-700 mb-8">
              {trustedCount} {trustedCount === 1 ? 'person is' : 'people are'} now in your Trusted
              Callers list.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[56px] rounded-xl bg-gray-900 text-white text-lg font-semibold"
            >
              Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function ChoiceButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full min-h-[64px] rounded-xl border-2 border-gray-300 text-left px-5 text-xl font-semibold text-gray-900 hover:border-gray-900"
    >
      {children}
    </button>
  )
}
