import { FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = {
  value: string
  onChange: (v: string) => void
  onSubmit?: () => void
}

export default function DreamInput({ value, onChange, onSubmit }: Props) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit?.()
  }
  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Ex.: história do jacaré que canta blues"
        className="flex-1 bg-white/5 border-white/10 text-white"
      />
    </form>
  )
}