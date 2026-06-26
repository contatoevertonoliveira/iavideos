type Props = { providerId: number }

export default function RoutingRules({ providerId }: Props) {
  return (
    <div className="border rounded p-3">
      <h3 className="font-medium mb-2">Regras de Roteamento (placeholder)</h3>
      <p className="text-sm text-gray-600">Configuração centralizada no backend via GET/PUT /ai/providers/routes. UI futura permitirá prioridades, custos e fallback.</p>
      <p className="text-xs">Provider ID: {providerId}</p>
    </div>
  )
}