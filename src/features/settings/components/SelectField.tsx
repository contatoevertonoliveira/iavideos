import React from 'react'

type Option = { value: string; label: string }

type Props = {
  label: string
  value: string
  options: Option[]
  onChange: (v: string) => void
}

export default function SelectField({ label, value, options, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm">{label}</label>
      <select className="bg-transparent border border-white/20 rounded px-2 py-1" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}