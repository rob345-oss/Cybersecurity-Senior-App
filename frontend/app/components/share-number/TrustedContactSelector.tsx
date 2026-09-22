'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import TrustedContactForm, {
  type ContactFormValues,
  validateContactForm,
} from './TrustedContactForm'
import type { TrustedContactInfo } from '@/app/share-number/api'
import { createTrustedContact, deleteTrustedContact, updateTrustedContact } from '@/app/share-number/api'

interface LocalContactRow {
  key: string
  contactId?: string
  values: ContactFormValues
  isSelected: boolean
  errors?: Partial<Record<keyof ContactFormValues, string>>
}

interface TrustedContactSelectorProps {
  contacts: TrustedContactInfo[]
  onContactsChange: () => Promise<void>
  onBulkSelect: (selected: boolean) => Promise<void>
}

export type TrustedContactSelectorHandle = {
  saveContacts: () => Promise<boolean>
}

function contactToRow(contact: TrustedContactInfo): LocalContactRow {
  return {
    key: contact.id,
    contactId: contact.id,
    values: {
      first_name: contact.first_name,
      phone: contact.phone,
      relationship: contact.relationship || '',
    },
    isSelected: contact.is_selected,
  }
}

const TrustedContactSelector = forwardRef<
  TrustedContactSelectorHandle,
  TrustedContactSelectorProps
>(function TrustedContactSelector({ contacts, onContactsChange, onBulkSelect }, ref) {
  const [rows, setRows] = useState<LocalContactRow[]>(() =>
    contacts.length > 0
      ? contacts.map(contactToRow)
      : [{ key: 'new-0', values: { first_name: '', phone: '', relationship: '' }, isSelected: true }]
  )
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (contacts.length > 0) {
      setRows(contacts.map(contactToRow))
    }
  }, [contacts])

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        values: { first_name: '', phone: '', relationship: '' },
        isSelected: true,
      },
    ])
  }

  const updateRow = (index: number, field: keyof ContactFormValues, value: string) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, values: { ...row.values, [field]: value }, errors: undefined } : row
      )
    )
  }

  const toggleRow = async (index: number) => {
    const row = rows[index]
    const nextSelected = !row.isSelected
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, isSelected: nextSelected } : r))
    )
    if (row.contactId) {
      await updateTrustedContact(row.contactId, { is_selected: nextSelected })
      await onContactsChange()
    }
  }

  const handleSelectAll = async (selected: boolean) => {
    setRows((prev) => prev.map((row) => ({ ...row, isSelected: selected })))
    await onBulkSelect(selected)
    await onContactsChange()
  }

  const saveContacts = async (): Promise<boolean> => {
    setFormError(null)
    let hasErrors = false
    const validated = rows.map((row) => {
      const errors = validateContactForm(row.values)
      if (Object.keys(errors).length > 0) hasErrors = true
      return { ...row, errors }
    })
    setRows(validated)
    if (hasErrors) {
      setFormError('Please fix the highlighted fields before continuing.')
      return false
    }

    const selectedRows = validated.filter((r) => r.isSelected)
    if (selectedRows.length === 0) {
      setFormError('Select at least one trusted contact to continue.')
      return false
    }

    setSaving(true)
    try {
      for (const row of validated) {
        if (row.contactId) {
          await updateTrustedContact(row.contactId, {
            first_name: row.values.first_name.trim(),
            phone: row.values.phone.trim(),
            relationship: row.values.relationship.trim() || undefined,
            is_selected: row.isSelected,
          })
        } else if (row.values.first_name.trim() || row.values.phone.trim()) {
          await createTrustedContact({
            first_name: row.values.first_name.trim(),
            phone: row.values.phone.trim(),
            relationship: row.values.relationship.trim() || undefined,
            is_selected: row.isSelected,
          })
        }
      }
      await onContactsChange()
      return true
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save contacts')
      return false
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ saveContacts }), [rows])

  const removeRow = async (index: number) => {
    const row = rows[index]
    if (row.contactId) {
      await deleteTrustedContact(row.contactId)
      await onContactsChange()
    }
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index)
      if (next.length === 0) {
        return [{ key: 'new-0', values: { first_name: '', phone: '', relationship: '' }, isSelected: true }]
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      <p className="text-base text-gray-700 leading-relaxed">
        Add the people you trust most. No message will be sent without your confirmation on the
        next steps.
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleSelectAll(true)}
          className="min-h-[44px] px-4 py-2 text-base font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => handleSelectAll(false)}
          className="min-h-[44px] px-4 py-2 text-base font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          Deselect all
        </button>
      </div>

      {rows.map((row, index) => (
        <div key={row.key} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <input
              id={`select-${row.key}`}
              type="checkbox"
              checked={row.isSelected}
              onChange={() => toggleRow(index)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              aria-label={`Select ${row.values.first_name || 'contact'}`}
            />
            <div className="flex-1">
              <TrustedContactForm
                idPrefix={row.key}
                values={row.values}
                errors={row.errors}
                onChange={(field, value) => updateRow(index, field, value)}
              />
            </div>
          </div>
          {(rows.length > 1 || row.contactId) && (
            <button
              type="button"
              onClick={() => removeRow(index)}
              className="text-sm font-medium text-red-700 hover:underline min-h-[44px]"
            >
              Remove contact
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        disabled={saving}
        className="min-h-[44px] px-4 py-2 text-base font-medium text-gray-900 border border-dashed border-gray-400 rounded-lg hover:bg-gray-50 w-full sm:w-auto disabled:opacity-50"
      >
        Add another contact
      </button>

      {formError && (
        <p className="text-sm text-red-700" role="alert">
          {formError}
        </p>
      )}
    </div>
  )
})

export default TrustedContactSelector
