import { useState } from 'react'
import SectionCard from '@/components/ui/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toastSuccess } from '@/lib/toast'
import DreamCanvas from './components/DreamCanvas'

type Props = { prompt: string; analyzed: any }

export default function CreatorFlowSemiAuto({ prompt }: Props) {
  const [useExistingChars, setUseExistingChars] = useState<boolean | null>(null)
  const [format, setFormat] = useState<string>('')
  const [hasMoral, setHasMoral] = useState<boolean | null>(null)
  const [generated, setGenerated] = useState<any | null>(null)
  const [blocks, setBlocks] = useState<Array<{ type: string; content: string }>>([{ type: 'prompt', content: prompt }])

  function addBlock(type: string, content: string) { setBlocks((arr) => [...arr, { type, content }]) }

  function quickGenerate() {
    const output = {
      script: 'Script básico com cenas principais (stub)',
      characters: [
        { name: 'Bambam', role: 'Protagonista' },
        { name: 'Lia', role: 'Mentora' },
      ],
      soundtrack: ['tema principal', 'variação alegre'],
    }
    setGenerated(output)
    addBlock('script', output.script)
    addBlock('characters', '2 personagens sugeridos')
    addBlock('soundtrack', 'Sugestões de trilha/voz')
    toastSuccess('Conteúdo inicial gerado (stub)')
  }

  function renderFinal() {
    addBlock('render', 'Renderizando vídeo final… (stub)')
    toastSuccess('Renderização disparada (stub)')
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Roteiro Semi-Automático ⚙️" subtitle="Você define poucos parâmetros, a IA completa">
        <div className="space-y-4">
          <div className="text-sm text-white/80">Deseja que eu use personagens existentes?</div>
          <div className="flex gap-2">
            <Button variant={useExistingChars === true ? 'default' : 'secondary'} onClick={() => { setUseExistingChars(true); addBlock('answer', 'Usar personagens existentes') }}>Sim</Button>
            <Button variant={useExistingChars === false ? 'default' : 'secondary'} onClick={() => { setUseExistingChars(false); addBlock('answer', 'Não usar personagens existentes') }}>Não</Button>
          </div>

          <div className="text-sm text-white/80">Qual o formato?</div>
          <div className="flex flex-wrap gap-2">
            {['short','vídeo','música','narração'].map((f) => (
              <button key={f} className={`px-3 py-2 rounded-lg border border-white/10 ${format === f ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => { setFormat(f); addBlock('answer', `Formato: ${f}`) }}>{f}</button>
            ))}
          </div>

          <div className="text-sm text-white/80">Quer que tenha moral da história?</div>
          <div className="flex gap-2">
            <Button variant={hasMoral === true ? 'default' : 'secondary'} onClick={() => { setHasMoral(true); addBlock('answer', 'Com moral') }}>Sim</Button>
            <Button variant={hasMoral === false ? 'default' : 'secondary'} onClick={() => { setHasMoral(false); addBlock('answer', 'Sem moral') }}>Não</Button>
          </div>

          <div className="flex justify-end"><Button onClick={quickGenerate}>Gerar conteúdo</Button></div>
        </div>
      </SectionCard>

      <DreamCanvas blocks={blocks} />

      {generated && (
        <SectionCard title="Resultado Inicial" subtitle="Edite personagens, revise script, ajuste trilha">
          <div className="space-y-2">
            <div className="text-sm text-white/80">Script: {generated.script}</div>
            <div className="text-sm text-white/80">Personagens: {generated.characters.map((c: any) => c.name).join(', ')}</div>
            <div className="text-sm text-white/80">Trilha: {generated.soundtrack.join(', ')}</div>
            <div className="flex justify-end"><Button className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white" onClick={renderFinal}>Gerar vídeo final</Button></div>
          </div>
        </SectionCard>
      )}
    </div>
  )
}