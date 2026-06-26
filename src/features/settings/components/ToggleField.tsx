import React from 'react'

type Props = {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

export default function ToggleField({ label, checked, onChange }: Props) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  )
}