import React from 'react'
import ToggleField from './ToggleField'

type Item = { key: string; label: string; checked: boolean }

type Props = {
  items: Item[]
  onToggle: (key: string, value: boolean) => void
}

export default function SwitchGroup({ items, onToggle }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((it) => (
        <ToggleField key={it.key} label={it.label} checked={it.checked} onChange={(v) => onToggle(it.key, v)} />
      ))}
    </div>
  )
}