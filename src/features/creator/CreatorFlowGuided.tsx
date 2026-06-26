import { useState } from 'react'
import SectionCard from '@/components/ui/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toastSuccess, toastError } from '@/lib/toast'
import DreamCanvas from './components/DreamCanvas'
import CharacterUploader from './components/CharacterUploader'

type Props = { prompt: string; analyzed: any }

export default function CreatorFlowGuided({ prompt, analyzed }: Props) {
  const [step, setStep] = useState<number>(0)
  const [hasCharacters, setHasCharacters] = useState<boolean | null>(null)
  const [characters, setCharacters] = useState<Array<{ name: string; description: string; face?: File | null }>>([])
  const [contentType, setContentType] = useState<string>('')
  const [tone, setTone] = useState<string>('')
  const [scriptLevel, setScriptLevel] = useState<'script' | 'idea' | ''>('')
  const [canvasBlocks, setCanvasBlocks] = useState<Array<{ type: string; content: string }>>([{ type: 'prompt', content: prompt }])

  function next() {
    setStep((s) => s + 1)
  }

  function addBlock(type: string, content: string) {
    setCanvasBlocks((arr) => [...arr, { type, content }])
  }

  function handleGenerateFinal() {
    if (!contentType || !tone || !scriptLevel) {
      toastError('Complete as escolhas antes de gerar')
      return
    }
    addBlock('generate', 'Gerando resultado final com IA…')
    toastSuccess('Gerando resultado final (stub)')
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Roteiro Guiado 🧭" subtitle="IA conduz perguntas, você responde">
        <div className="space-y-4">
          {step === 0 && (
            <div className="space-y-3">
              <div className="text-sm text-white/80">Você já tem os personagens criados?</div>
              <div className="flex gap-2">
                <Button variant={hasCharacters === true ? 'default' : 'secondary'} onClick={() => { setHasCharacters(true); addBlock('answer', 'Já tenho personagens') }}>Já tenho</Button>
                <Button variant={hasCharacters === false ? 'default' : 'secondary'} onClick={() => { setHasCharacters(false); addBlock('answer', 'Quero criar personagens') }}>Quero criar</Button>
              </div>
              {hasCharacters === true && (
                <CharacterUploader characters={characters} setCharacters={setCharacters} />
              )}
              {hasCharacters === false && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm text-white/80 mb-2">Envie imagens de referência ou descreva</div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                    <input type="file" accept="image/*" className="text-white/80" />
                    <Input placeholder="Descrição ou URL de referência" className="bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
              )}
              <div className="flex justify-end"><Button onClick={next} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Continuar</Button></div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <div className="text-sm text-white/80">Qual o tipo de conteúdo?</div>
              <div className="flex flex-wrap gap-2">
                {['Vídeo Longo','Música','Narração','Short/Reel'].map((t) => (
                  <button key={t} className={`px-3 py-2 rounded-lg border border-white/10 ${contentType === t ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => { setContentType(t); addBlock('answer', `Tipo: ${t}`) }}>{t}</button>
                ))}
              </div>
              <div className="flex justify-end"><Button onClick={next} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Continuar</Button></div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="text-sm text-white/80">Qual o tom desejado?</div>
              <div className="flex flex-wrap gap-2">
                {['Infantil','Motivacional','Cômico','Emocional','Científico'].map((t) => (
                  <button key={t} className={`px-3 py-2 rounded-lg border border-white/10 ${tone === t ? 'bg-[#FFD700] text-[#212529]' : 'bg-white/5 text-white/80'}`} onClick={() => { setTone(t); addBlock('answer', `Tom: ${t}`) }}>{t}</button>
                ))}
              </div>
              <div className="flex justify-end"><Button onClick={next} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Continuar</Button></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="text-sm text-white/80">Quer que eu escreva o roteiro ou apenas a ideia?</div>
              <div className="flex gap-2">
                <Button variant={scriptLevel === 'script' ? 'default' : 'secondary'} onClick={() => { setScriptLevel('script'); addBlock('answer', 'Escrever roteiro completo') }}>Roteiro completo</Button>
                <Button variant={scriptLevel === 'idea' ? 'default' : 'secondary'} onClick={() => { setScriptLevel('idea'); addBlock('answer', 'Gerar resumo narrativo') }}>Apenas ideia</Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setStep(2)}>Voltar</Button>
                <Button onClick={() => setStep(4)} className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]">Continuar</Button>
              </div>
            </div>
          )}

          {step >= 4 && (
            <div className="space-y-3">
              <Button className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]" onClick={handleGenerateFinal}>Gerar Resultado Final</Button>
            </div>
          )}
        </div>
      </SectionCard>

      <DreamCanvas blocks={canvasBlocks} />
    </div>
  )
}