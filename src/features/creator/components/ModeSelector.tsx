import { Button } from '@/components/ui/button'

type Mode = 'guided' | 'semi' | 'auto'

type Props = {
  onSelect: (m: Mode) => void
  disabled?: boolean
  tooltip?: string
}

export default function ModeSelector({ onSelect, disabled, tooltip }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" onClick={() => onSelect('guided')} disabled={disabled} title={disabled ? (tooltip || '') : undefined}>Roteiro Guiado 🧭</Button>
      <Button variant="secondary" onClick={() => onSelect('semi')} disabled={disabled} title={disabled ? (tooltip || '') : undefined}>Semi-Automático ⚙️</Button>
      <Button variant="secondary" onClick={() => onSelect('auto')} disabled={disabled} title={disabled ? (tooltip || '') : undefined}>Automático 🤖</Button>
    </div>
  )
}