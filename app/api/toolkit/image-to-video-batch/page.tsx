'use client';

import React, { useState } from 'react';

type ApiResult = {
  imageUrl: string;
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
};

export default function ImageToVideoBatchPage() {
  const [imageUrlsText, setImageUrlsText] = useState('');
  const [imageUrlField, setImageUrlField] = useState('image_url'); // nome do campo conforme docs do NCA
  const [payloadTemplateText, setPayloadTemplateText] = useState(
    `{
  "output_format": "mp4",
  "duration_seconds": 10,
  "zoom_mode": "ken_burns",
  "webhook_url": ""
}`,
  );

  const [results, setResults] = useState<ApiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setResults([]);
    setLoading(true);

    const imageUrls = imageUrlsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (imageUrls.length === 0) {
      setErrorMessage('Coloque pelo menos uma URL de imagem (uma por linha).');
      setLoading(false);
      return;
    }

    let payloadTemplate: Record<string, unknown>;
    try {
      payloadTemplate = JSON.parse(payloadTemplateText);
    } catch (err) {
      setErrorMessage(
        'Payload template não é um JSON válido. Verifique aspas, vírgulas e chaves.',
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/toolkit/image-to-video-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrls,
          imageUrlField,
          payloadTemplate,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const msg =
          (errorBody && (errorBody.error as string)) ||
          `Erro ao chamar a API interna (status ${response.status}).`;
        setErrorMessage(msg);
      } else {
        const data = (await response.json()) as { results: ApiResult[] };
        setResults(data.results || []);
      }
    } catch (err) {
      setErrorMessage(
        `Erro inesperado ao chamar a API: ${(err as Error).message}`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="border-b border-slate-800 px-6 py-4">
        <h1 className="text-2xl font-semibold">
          NCA Toolkit – Imagem &rarr; Vídeo (lote)
        </h1>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Usa o endpoint <code className="font-mono">/v1/image/convert/video</code>{' '}
          do No-Code Architects Toolkit para transformar várias imagens em
          vídeos de uma vez. Você define o{' '}
          <span className="font-mono">payload</span> base conforme a documentação
          oficial e o dashboard dispara um job para cada imagem.
        </p>
      </header>

      <main className="flex-1 px-6 py-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* FORMULÁRIO */}
        <section className="w-full lg:w-1/2 space-y-4">
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-lg"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                URLs das imagens (uma por linha)
              </label>
              <textarea
                className="w-full h-40 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={`https://meu-bucket.s3.amazonaws.com/imagem1.png
https://meu-bucket.s3.amazonaws.com/imagem2.png
https://meu-bucket.s3.amazonaws.com/imagem3.png`}
                value={imageUrlsText}
                onChange={(e) => setImageUrlsText(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Use as URLs que o NCA Toolkit consegue acessar (S3, GCS,
                storage público, etc.).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Nome do campo de URL da imagem no payload
              </label>
              <input
                type="text"
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={imageUrlField}
                onChange={(e) => setImageUrlField(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Exemplo: <code className="font-mono">image_url</code>. Confere
                na documentação do <strong>/v1/image/convert/video</strong> qual
                é o nome correto do campo (se mudar, é só trocar aqui).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Payload template (JSON)
              </label>
              <textarea
                className="w-full h-52 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono resize-y focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={payloadTemplateText}
                onChange={(e) => setPayloadTemplateText(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Esse JSON será enviado para o NCA Toolkit para cada imagem,
                sobrescrevendo apenas o campo{' '}
                <code className="font-mono">{imageUrlField}</code> com a URL de
                cada linha acima. Use aqui exatamente o formato que a doc oficial
                pede (campos de duração, zoom, formato, webhook_url etc.).
              </p>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processando imagens...' : 'Enviar para NCA Toolkit'}
            </button>
          </form>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
            <p className="font-semibold text-slate-200">
              Como usar com a documentação oficial
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Abra a doc do endpoint{' '}
                <code className="font-mono">/v1/image/convert/video</code> no
                repo original.
              </li>
              <li>
                Monte um payload válido no campo{' '}
                <span className="font-mono">Payload template</span> (sem a parte
                da URL da imagem ou já incluindo, tanto faz).
              </li>
              <li>
                Informe o campo de URL da imagem em{' '}
                <span className="font-mono">Nome do campo</span> (ex.{' '}
                <code className="font-mono">image_url</code>).
              </li>
              <li>
                Cole várias URLs de imagem (uma por linha) e clique em{' '}
                <strong>Enviar</strong>. O dashboard dispara um job por imagem e
                mostra a resposta bruta da API para cada uma.
              </li>
            </ul>
          </div>
        </section>

        {/* RESULTADOS */}
        <section className="w-full lg:w-1/2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg min-h-[200px]">
            <h2 className="text-lg font-semibold mb-2">
              Resultados dos jobs (imagem → vídeo)
            </h2>

            {results.length === 0 && !loading && (
              <p className="text-sm text-slate-500">
                Nenhum job executado ainda. Envie algumas imagens pelo
                formulário ao lado.
              </p>
            )}

            {results.length > 0 && (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {results.map((r, idx) => (
                  <div
                    key={`${r.imageUrl}-${idx}`}
                    className="border border-slate-800 rounded-lg p-3 bg-slate-950/60"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="text-xs text-slate-400 truncate">
                        <span className="font-semibold text-slate-200">
                          Imagem:
                        </span>{' '}
                        <span className="break-all">{r.imageUrl}</span>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          r.ok
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/15 text-red-300 border border-red-500/40'
                        }`}
                      >
                        {r.ok ? 'OK' : 'ERRO'} · {r.status}
                      </span>
                    </div>

                    {r.error && (
                      <p className="text-xs text-red-300 mb-2">
                        Erro: {r.error}
                      </p>
                    )}

                    {r.data && (
                      <pre className="text-[11px] leading-snug bg-slate-900 border border-slate-800 rounded-md p-2 overflow-x-auto">
                        {JSON.stringify(r.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
