import React from 'react'

type Props = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
}

export default function AiParameterSlider({ label, value, min = 0, max = 1, step = 0.01, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm">{label}: <span className="font-mono">{value.toFixed(2)}</span></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}