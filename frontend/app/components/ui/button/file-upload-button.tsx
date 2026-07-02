'use client'

import { useId, useRef } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/app/utils/cn'
import { Button, type ButtonProps } from './button'

interface FileUploadButtonProps extends Omit<ButtonProps, 'onClick' | 'type'> {
  accept?: string
  multiple?: boolean
  onFilesSelected: (files: FileList) => void
  inputAriaLabel?: string
}

export function FileUploadButton({
  accept,
  multiple = false,
  onFilesSelected,
  inputAriaLabel = 'Choose file to upload',
  children = 'Upload file',
  leftIcon = Upload,
  className,
  disabled,
  ...buttonProps
}: FileUploadButtonProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onFilesSelected(files)
    }
    event.target.value = ''
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={inputAriaLabel}
        className="sr-only"
        onChange={handleChange}
      />
      <Button
        leftIcon={leftIcon}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        aria-controls={inputId}
        {...buttonProps}
      >
        {children}
      </Button>
    </div>
  )
}
