import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, Image as ImageIcon, Music2, Sparkles, Play, UploadCloud } from "lucide-react";

export default function Create() {
  const items = [
    {
      key: "video",
      title: "Vídeo",
      icon: Film,
      description: "Combine roteiros, clipes e trilhas com IA.",
      to: "/composer/new",
      hint: "Recomendado",
    },
    {
      key: "image",
      title: "Imagem",
      icon: ImageIcon,
      description: "Gere thumbnails e artes para seus vídeos.",
      to: "/assets",
      hint: "Stable Flow",
    },
    {
      key: "audio",
      title: "Áudio",
      icon: Music2,
      description: "Criar narração, trilhas e efeitos sonoros.",
      to: "/assistant",
      hint: "TTS+SFX",
    },
  ];

  return (
    <div className="container-fluid">
      <div className="space-y-6">
      <header className="rounded-2xl border border-cine relative overflow-hidden">
        <div className="absolute inset-0 gradient-cine opacity-30" />
        <div className="relative p-6 md:p-8 bg-cine-surface">
          <h1 className="text-2xl md:text-3xl font-semibold neural-heading tracking-tight">Criar novo projeto</h1>
          <p className="mt-2 text-cine-muted">Escolha um fluxo para iniciar sua criação cinematográfica.</p>
          <div className="mt-4 flex gap-2">
            <Badge className="bg-cine-surface-90 text-cine border border-cine">NeuralCineFlow</Badge>
            <Badge className="bg-cine-surface-90 text-cine border border-cine">Dark/Light ready</Badge>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(({ key, title, icon: Icon, description, to, hint }) => (
          <Card key={key} className="neural-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-cine">
                <div className="p-2 rounded-cine bg-cine-surface text-cine">
                  <Icon className="h-5 w-5" />
                </div>
                <span>{title}</span>
                <span className="ml-auto text-xs text-cine-muted inline-flex items-center gap-1"><Sparkles className="h-3 w-3" />{hint}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-cine-muted mb-4">{description}</p>
              <div className="flex gap-2">
                <Link to={to} className="gradient-cine text-white rounded-md px-3 py-2 inline-flex items-center text-sm">
                  <Play className="h-4 w-4 mr-1" /> Começar
                </Link>
                <Button variant="outline" className="border-cine text-cine hover-cine inline-flex items-center">
                  <UploadCloud className="h-4 w-4 mr-1" /> Importar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
    </div>
  );
}