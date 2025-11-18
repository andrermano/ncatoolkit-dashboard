'use client';

import React, { useState } from 'react';

type ApiResult = {
  imageUrl: string;
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
};

export default function ImageToVideoPage() {
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [imageUrlField, setImageUrlField] = useState('image_url');

  // ⚠️ IMPORTANTE:
  // A versão atual da NCA que você está usando NÃO aceita
  // duration_seconds / output_format / zoom_mode.
  // Então o template padrão vai só com webhook_url (opcional).
  const [payloadTemplateText, setPayloadTemplateText] = useState(
    JSON.stringify(
      {
        webhook_url: '',
      },
      null,
      2,
    ),
  );

  const [results, setResults] = useState<ApiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setResults([]);

    const imageUrls = imageUrlsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (imageUrls.length === 0) {
      setErrorMessage('Informe pelo menos uma URL de imagem (uma por linha).');
      return;
    }

    let payloadTemplate: Record<string, unknown> = {};
    if (payloadTemplateText.trim()) {
      try {
        payloadTemplate = JSON.parse(payloadTemplateText);
      } catch (error) {
        setErrorMessage(
          'Payload JSON inválido: ' + (error as Error).message,
        );
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/toolkit/image-to-video-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
          imageUrlField,
          payloadTemplate,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(
          json?.error ??
            `Erro ao enviar as imagens para o Toolkit (status ${res.status}).`,
        );
        return;
      }

      setResults((json.jobs ?? []) as ApiResult[]);
    } catch (error) {
      setErrorMessage(
        'Erro de rede ao conversar com o backend: ' +
          (error as Error).message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">
          Image → Video (batch)
        </h1>
        <p className="text-sm text-slate-400">
          Cria vários jobs no endpoint{' '}
          <code className="font-mono text-xs">
            /v1/image/convert/video
          </code>{' '}
          do No-Code Architects Toolkit a partir de uma lista de URLs
          de imagem.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-4"
      >
        <div className="grid gap-4 md:grid-cols-2">
          {/* Lista de imagens */}
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-300">
              Image URLs (uma por linha)
            </label>
            <textarea
              className="h-40 w-full rounded-md border border-slate-700 bg-slate-950/60 p-2 text-xs font-mono text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              placeholder="https://storage.googleapis.com/bucket/imagem_01.png&#10;https://storage.googleapis.com/bucket/imagem_02.png&#10;..."
              value={imageUrlsText}
              onChange={(e) => setImageUrlsText(e.target.value)}
            />
            <p className="text-[11px] text-slate-400">
              Cada linha será usada para criar um job separado.
            </p>
          </div>

          {/* Template de payload */}
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-300">
              Payload template (JSON)
            </label>
            <textarea
              className="h-40 w-full rounded-md border border-slate-700 bg-slate-950/60 p-2 text-xs font-mono text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              value={payloadTemplateText}
              onChange={(e) => setPayloadTemplateText(e.target.value)}
            />
            <p className="text-[11px] text-slate-400">
              O campo{' '}
              <code className="font-mono text-[11px]">
                {imageUrlField}
              </code>{' '}
              será preenchido automaticamente para cada imagem.
              <br />
              Se a API reclamar de &quot;Additional properties&quot;,
              remova/ajuste os campos para o formato aceito pela sua
              instalação da NCA.
            </p>
          </div>
        </div>

        {/* Campo do nome do atributo de URL */}
        <div className="space-y-1">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-300">
            Nome do campo da URL da imagem
          </label>
          <input
            className="w-full max-w-xs rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs font-mono text-slate-100 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            value={imageUrlField}
            onChange={(e) => setImageUrlField(e.target.value)}
          />
          <p className="text-[11px] text-slate-400">
            Em muitas versões da API esse campo é{' '}
            <code className="font-mono text-[11px]">image_url</code>.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md border border-sky-500 bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Enviando jobs…' : 'Criar jobs de vídeo'}
        </button>
      </form>

      {errorMessage && (
        <div className="rounded-md border border-red-500 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      {results.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-medium">
            Resultados dos jobs (imagem → vídeo)
          </h2>
          <div className="space-y-3">
            {results.map((r, idx) => (
              <div
                key={`${r.imageUrl}-${idx}`}
                className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs md:text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="break-all font-mono">
                    Imagem: {r.imageUrl}
                  </div>
                  <span
                    className={
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ' +
                      (r.ok
                        ? 'border-emerald-500/70 bg-emerald-900/50 text-emerald-100'
                        : 'border-red-500/70 bg-red-900/50 text-red-100')
                    }
                  >
                    {r.ok ? `OK · ${r.status}` : `ERRO · ${r.status}`}
                  </span>
                </div>

                {typeof r.data !== 'undefined' && (
                  <pre className="mt-2 max-h-60 overflow-auto rounded-md border border-slate-800 bg-slate-900 p-2 text-[11px] leading-snug">
                    {JSON.stringify(r.data as any, null, 2)}
                  </pre>
                )}

                {r.error && (
                  <p className="mt-1 text-[11px] text-red-300">
                    {r.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
