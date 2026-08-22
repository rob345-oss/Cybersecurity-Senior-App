'use client'

import { validatePhone } from '@/app/utils/phone'

export interface ContactFormValues {
  first_name: string
  phone: string
  relationship: string
}

interface TrustedContactFormProps {
  idPrefix: string
  values: ContactFormValues
  errors?: Partial<Record<keyof ContactFormValues, string>>
  onChange: (field: keyof ContactFormValues, value: string) => void
  onBlurValidate?: () => void
}

export function validateContactForm(values: ContactFormValues): Partial<
  Record<keyof ContactFormValues, string>
> {
  const errors: Partial<Record<keyof ContactFormValues, string>> = {}
  if (!values.first_name.trim()) {
    errors.first_name = 'First name is required'
  }
  if (!values.phone.trim()) {
    errors.phone = 'Phone number is required'
  } else if (!validatePhone(values.phone)) {
    errors.phone = 'Enter a valid phone number (10–15 digits, + allowed for international)'
  }
  return errors
}

export default function TrustedContactForm({
  idPrefix,
  values,
  errors = {},
  onChange,
  onBlurValidate,
}: TrustedContactFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor={`${idPrefix}-first-name`} className="block text-base font-medium text-gray-900 mb-1">
          First name <span className="text-red-600">*</span>
        </label>
        <input
          id={`${idPrefix}-first-name`}
          type="text"
          autoComplete="given-name"
          value={values.first_name}
          onChange={(e) => onChange('first_name', e.target.value)}
          onBlur={onBlurValidate}
          aria-describedby={errors.first_name ? `${idPrefix}-first-name-error` : undefined}
          aria-invalid={Boolean(errors.first_name)}
          className="w-full min-h-[44px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
        />
        {errors.first_name && (
          <p id={`${idPrefix}-first-name-error`} className="mt-1 text-sm text-red-700">
            {errors.first_name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-phone`} className="block text-base font-medium text-gray-900 mb-1">
          Phone number <span className="text-red-600">*</span>
        </label>
        <input
          id={`${idPrefix}-phone`}
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          value={values.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          onBlur={onBlurValidate}
          aria-describedby={errors.phone ? `${idPrefix}-phone-error` : undefined}
          aria-invalid={Boolean(errors.phone)}
          placeholder="+1 555 123 4567"
          className="w-full min-h-[44px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
        />
        {errors.phone && (
          <p id={`${idPrefix}-phone-error`} className="mt-1 text-sm text-red-700">
            {errors.phone}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-relationship`}
          className="block text-base font-medium text-gray-900 mb-1"
        >
          Relationship <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          id={`${idPrefix}-relationship`}
          type="text"
          value={values.relationship}
          onChange={(e) => onChange('relationship', e.target.value)}
          placeholder="e.g., daughter, neighbor"
          className="w-full min-h-[44px] px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
        />
      </div>
    </div>
  )
}
