'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type JobResult = {
  imageUrl: string;
  ok: boolean;
  status: number;
  id?: number;
  data?: unknown;
  error?: string;
};

export default function ImageToVideoPage() {
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [duration, setDuration] = useState<number>(15);
  const [baseId, setBaseId] = useState<number>(1);
  const [imageUrlField, setImageUrlField] = useState('image_url');
  const [extraPayloadText, setExtraPayloadText] = useState(
    JSON.stringify(
      {
        webhook_url: '',
      },
      null,
      2,
    ),
  );

  const [results, setResults] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setResults([]);

    // 1) URLs
    const imageUrls = imageUrlsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (imageUrls.length === 0) {
      setErrorMessage('Informe pelo menos uma URL de imagem (uma por linha).');
      return;
    }

    // 2) duração
    if (!Number.isFinite(duration) || duration <= 0) {
      setErrorMessage('Informe uma duração em segundos maior que 0.');
      return;
    }

    // 3) baseId
    if (!Number.isFinite(baseId)) {
      setErrorMessage('O ID base deve ser um número válido.');
      return;
    }

    // 4) payload extra (JSON opcional)
    let extraPayload: Record<string, unknown> = {};
    if (extraPayloadText.trim()) {
      try {
        extraPayload = JSON.parse(extraPayloadText);
      } catch (error) {
        setErrorMessage(
          'Payload JSON extra inválido: ' + (error as Error).message,
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
          duration,
          baseId,
          extraPayload,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(
          json?.error ??
            `Erro ao criar jobs (status ${res.status}). Verifique o Toolkit API.`,
        );
        return;
      }

      setResults((json.jobs ?? []) as JobResult[]);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Image → Video (batch)
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Cria vários jobs no endpoint{' '}
              <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                /v1/image/convert/video
              </code>{' '}
              a partir de uma lista de URLs de imagem.
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Link
              href="/"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Voltar para o dashboard
            </Link>
            <span className="text-xs text-gray-500">v1.1.0</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário principal */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Configurar jobs
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Para cada linha de URL, será criado um payload com o formato:
                <br />
                <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                  &#123;&quot;image_url&quot;: &quot;...&quot;,
                  &quot;length&quot;: 15, &quot;id&quot;: 52, ...&#125;
                </code>
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* URLs */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Image URLs (uma por linha)
                  </label>
                  <textarea
                    className="h-32 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={
                      'https://storage.googleapis.com/bucket/imagem_01.png\nhttps://storage.googleapis.com/bucket/imagem_02.png\n...'
                    }
                    value={imageUrlsText}
                    onChange={(e) => setImageUrlsText(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500">
                    Cada linha vira um job separado na NCA Toolkit API.
                  </p>
                </div>

                {/* Duração + ID base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      Duração (length) em segundos
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={duration}
                      onChange={(e) =>
                        setDuration(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value),
                        )
                      }
                    />
                    <p className="text-[11px] text-gray-500">
                      Este valor será enviado como{' '}
                      <code className="font-mono text-[11px]">
                        length
                      </code>{' '}
                      em todos os jobs.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      ID base
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={baseId}
                      onChange={(e) =>
                        setBaseId(
                          e.target.value === ''
                            ? 0
                            : Number(e.target.value),
                        )
                      }
                    />
                    <p className="text-[11px] text-gray-500">
                      O primeiro job recebe{' '}
                      <code className="font-mono text-[11px]">id</code>{' '}
                      igual a este valor, o próximo +1, e assim por diante.
                    </p>
                  </div>
                </div>

                {/* Nome do campo de URL */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Nome do campo da URL da imagem
                  </label>
                  <input
                    className="w-full max-w-xs rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={imageUrlField}
                    onChange={(e) => setImageUrlField(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500">
                    Normalmente é{' '}
                    <code className="font-mono text-[11px]">
                      image_url
                    </code>
                    , igual ao que você já usa no n8n.
                  </p>
                </div>

                {/* Payload extra */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Payload extra (JSON opcional)
                  </label>
                  <textarea
                    className="h-32 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-xs font-mono text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={extraPayloadText}
                    onChange={(e) => setExtraPayloadText(e.target.value)}
                  />
                  <p className="text-[11px] text-gray-500">
                    Tudo que for definido aqui será mesclado no payload de
                    cada job. Campos{' '}
                    <code className="font-mono text-[11px]">
                      {imageUrlField}
                    </code>
                    ,{' '}
                    <code className="font-mono text-[11px]">
                      length
                    </code>{' '}
                    e{' '}
                    <code className="font-mono text-[11px]">id</code> são
                    preenchidos automaticamente.
                  </p>
                </div>

                {/* Botão */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Criando jobs…' : 'Criar jobs de vídeo'}
                  </button>
                </div>
              </form>
            </div>

            {/* Erro global */}
            {errorMessage && (
              <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                {errorMessage}
              </div>
            )}
          </section>

          {/* Dica / explicação */}
          <aside className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Como fica o payload final?
              </h3>
              <p className="text-xs text-gray-700 mb-2">
                Para cada URL, o backend monta algo assim:
              </p>
              <pre className="text-[11px] leading-snug bg-gray-900 text-gray-100 rounded-md px-3 py-2 overflow-x-auto">
{`{
  "image_url": "https://storage.googleapis.com/.../cena_52.png",
  "length": 15,
  "id": 52,
  "...payloadExtra"
}`}
              </pre>
              <p className="text-[11px] text-gray-500 mt-2">
                O comportamento é compatível com o que você já usa no n8n.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Dica
              </h3>
              <p className="text-xs text-gray-700">
                Se a API retornar erro 400 com{' '}
                <code className="font-mono text-[11px]">
                  Additional properties
                </code>
                , remova do payload extra qualquer campo não reconhecido
                pela sua instância da NCA.
              </p>
            </div>
          </aside>
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Resultados dos jobs
            </h2>
            <div className="space-y-3">
              {results.map((r, index) => (
                <div
                  key={`${r.imageUrl}-${index}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-700">
                        Imagem
                      </span>
                      <span className="font-mono text-xs text-gray-900 break-all">
                        {r.imageUrl}
                      </span>
                      {typeof r.id !== 'undefined' && (
                        <span className="mt-1 text-[11px] text-gray-500">
                          id: {r.id}
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                        r.ok
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {r.ok ? `OK · ${r.status}` : `ERRO · ${r.status}`}
                    </span>
                  </div>

                  {r.error && (
                    <p className="mt-2 text-xs text-red-700">
                      {r.error}
                    </p>
                  )}

                  {typeof r.data !== 'undefined' && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-700">
                        Ver resposta bruta
                      </summary>
                      <pre className="mt-1 max-h-60 overflow-auto rounded-md bg-gray-900 text-gray-100 text-[11px] leading-snug px-3 py-2">
                        {JSON.stringify(r.data as any, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Built with Next.js • Powered by No-Code Architects Toolkit API
            </p>
            <p className="mt-2">
              <a
                href="https://github.com/Davidb-2107/no-code-architects-toolkit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
