import { useState } from 'react'
import SectionCard from '@/components/ui/SectionCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toastSuccess, toastError } from '@/lib/toast'

type Mode = 'manual' | 'semi' | 'auto'
type Format = 'short' | 'reels' | 'long' | 'music' | 'narration'

export default function CreateWizard() {
  const [step, setStep] = useState<'intro' | 'characters' | 'format' | 'mode' | 'stories' | 'preview'>('intro')
  const [ideaText, setIdeaText] = useState('')
  const [channelUrl, setChannelUrl] = useState('')
  const [charactersMode, setCharactersMode] = useState<'have' | 'create' | null>(null)
  const [characters, setCharacters] = useState<Array<{ name: string; description: string; face?: File | null }>>([])
  const [format, setFormat] = useState<Format | null>(null)
  const [mode, setMode] = useState<Mode>('semi')

  function proceedIntro(withAuto = false) {
    if (withAuto) {
      setMode('auto')
      toastSuccess('Ok, deixa comigo. Vou propor histórias.')
      setStep('stories')
      return
    }
    if (!ideaText && !channelUrl) {
      toastError('Digite uma ideia ou informe um canal para se inspirar')
      return
    }
    setStep('characters')
  }

  function addCharacter() {
    setCharacters((arr) => [...arr, { name: '', description: '', face: null }])
  }

  function proceedCharacters() {
    if (!charactersMode) {
      toastError('Selecione se você já tem personagens ou quer criar')
      return
    }
    setStep('format')
  }

  function proceedFormat() {
    if (!format) {
      toastError('Escolha o formato do conteúdo')
      return
    }
    setStep('mode')
  }

  function proceedMode() {
    if (!mode) return
    setStep('stories')
  }

  function generateStoriesStub() {
    // Futuro: chamar POST /jobs/{id}/generate-story e listar opções
    toastSuccess('Gerando 3–5 histórias com base na sua ideia…')
  }

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Criação · Página dos sonhos</h1>
        <p className="text-sm text-white/60">Deixe seus sonhos ganharem vida com ajuda da IA. Vamos construir o cenário passo a passo e manter a tela limpa.</p>
      </div>

      {step === 'intro' && (
        <SectionCard title="Comece pela sua ideia" subtitle="Descreva o que quer criar hoje, ou deixe comigo">
          <div className="space-y-3">
            <label className="block text-xs text-white/70">Descreva o que quer criar hoje</label>
            <Input value={ideaText} onChange={(e) => setIdeaText(e.target.value)} placeholder="Ex.: Uma história sobre um viajante que encontra um farol" className="bg-white/5 border-white/10 text-white" />
            <div className="text-xs text-white/60">Ou me deixe analisar um canal para me inspirar (não copiar):</div>
            <Input value={channelUrl} onChange={(e) => setChannelUrl(e.target.value)} placeholder="URL do canal (YouTube/IG/TikTok)" className="bg-white/5 border-white/10 text-white" />
            <div className="flex gap-2 justify-end mt-3">
              <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={() => proceedIntro(true)}>Deixe comigo</Button>
              <Button className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white" onClick={() => proceedIntro(false)}>OK</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'characters' && (
        <SectionCard title="Personagens" subtitle="Você já tem personagens criados?">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button className={`px-3 py-2 rounded-lg border border-white/10 ${charactersMode === 'have' ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => setCharactersMode('have')}>Já tenho</button>
              <button className={`px-3 py-2 rounded-lg border border-white/10 ${charactersMode === 'create' ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => setCharactersMode('create')}>Quero criar</button>
            </div>
            {charactersMode === 'have' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/80 mb-2">Anexe o rosto e a descrição de cada personagem</div>
                <div className="space-y-3">
                  {characters.map((c, idx) => (
                    <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr]">
                      <Input value={c.name} onChange={(e) => setCharacters((arr) => arr.map((it, i) => i === idx ? { ...it, name: e.target.value } : it))} placeholder="Nome" className="bg-white/5 border-white/10 text-white" />
                      <Input value={c.description} onChange={(e) => setCharacters((arr) => arr.map((it, i) => i === idx ? { ...it, description: e.target.value } : it))} placeholder="Descrição" className="bg-white/5 border-white/10 text-white" />
                      <input type="file" accept="image/*" onChange={(e) => setCharacters((arr) => arr.map((it, i) => i === idx ? { ...it, face: e.target.files?.[0] || null } : it))} className="text-white/80" />
                    </div>
                  ))}
                  <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/20" onClick={addCharacter}>Adicionar personagem</Button>
                </div>
              </div>
            )}
            {charactersMode === 'create' && (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm text-white/80 mb-2">Anexe uma foto para a IA se inspirar, ou cole uma referência</div>
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                  <input type="file" accept="image/*" className="text-white/80" />
                  <Input placeholder="Link de referência (imagem/personagem)" className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary">Voltar</Button>
              <Button className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]" onClick={proceedCharacters}>Continuar</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'format' && (
        <SectionCard title="Formato" subtitle="Defina tamanho e natureza do conteúdo">
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['short','reels','long','music','narration'] as Format[]).map((f) => (
                <button key={f} className={`px-3 py-2 rounded-lg border border-white/10 ${format === f ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/5 text-white/80'}`} onClick={() => setFormat(f)}>
                  {f === 'short' && 'Short (≤60s)'}
                  {f === 'reels' && 'Reels (≤90s)'}
                  {f === 'long' && 'Vídeo longo (2–5min)'}
                  {f === 'music' && 'Música'}
                  {f === 'narration' && 'Narração'}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary">Voltar</Button>
              <Button className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]" onClick={proceedFormat}>Continuar</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'mode' && (
        <SectionCard title="Modo de criação" subtitle="Escolha entre manual, semi-automático ou automático">
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['manual','semi','auto'] as Mode[]).map((m) => (
                <button key={m} className={`px-3 py-2 rounded-lg border border-white/10 ${mode === m ? 'bg-[#FFD700] text-[#212529]' : 'bg-white/5 text-white/80 hover:bg-white/10'}`} onClick={() => setMode(m)}>
                  {m === 'manual' && 'Manual'}
                  {m === 'semi' && 'Semi-automático'}
                  {m === 'auto' && 'Automático'}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary">Voltar</Button>
              <Button className="bg-[#FFD700] text-[#052c65] font-bold hover:bg-[#F59E0B]" onClick={proceedMode}>Continuar</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 'stories' && (
        <SectionCard title="Histórias propostas pela IA" subtitle="A IA sugerirá de 3 a 5 opções baseadas na sua ideia">
          <div className="space-y-3">
            <div className="text-sm text-white/80">Quando estiver pronto, clique para gerar opções. Em seguida você poderá escolher uma para renderizar.</div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary">Voltar</Button>
              <Button className="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white" onClick={generateStoriesStub}>Gerar opções</Button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
    </div>
  )
}