'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type ApiJob = {
  imageUrl: string;
  id?: number;
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
};

type UiJob = {
  imageUrl: string;
  id: number;
  toolkitJobId?: string;
  createStatus: number;
  createOk: boolean;
  createError?: string;
  statusStage: 'pending' | 'processing' | 'finished' | 'error';
  lastStatusMessage?: string;
  downloadUrl?: string | null;
  rawStatus?: unknown;
};

type JobStatusApiItem = {
  jobId: string;
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
};

type JobStatusApiResponse = {
  results?: JobStatusApiItem[];
  error?: string;
};

function extractVideoUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const visited = new Set<unknown>();

  function search(obj: unknown): string | null {
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    if (visited.has(obj)) {
      return null;
    }
    visited.add(obj);

    const values = Object.values(obj as Record<string, unknown>);
    for (const value of values) {
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        const isHttp =
          lower.startsWith('http://') || lower.startsWith('https://');
        const looksLikeVideo =
          lower.includes('.mp4') ||
          lower.includes('.webm') ||
          lower.includes('.mov') ||
          lower.includes('.mkv');

        if (isHttp && looksLikeVideo) {
          return value;
        }
      } else if (value && typeof value === 'object') {
        const nested = search(value);
        if (nested) return nested;
      }
    }
    return null;
  }

  return search(data);
}

function isStatusFinished(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const obj = data as Record<string, unknown>;

  let explicitFlag = false;
  if (typeof obj.isFinished === 'boolean') {
    explicitFlag = obj.isFinished;
  }

  let message = '';
  if (typeof obj.message === 'string') {
    message = obj.message;
  }

  let statusText = '';
  if (typeof obj.status === 'string') {
    statusText = obj.status;
  }

  const combined = (message + ' ' + statusText).toLowerCase();

  const textFinished =
    combined.includes('complete') ||
    combined.includes('completed') ||
    combined.includes('finished') ||
    combined.includes('done') ||
    combined.includes('error') ||
    combined.includes('failed');

  return explicitFlag || textFinished;
}

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

  const [jobs, setJobs] = useState<UiJob[]>([]);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setJobs([]);

    const imageUrls = imageUrlsText
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (imageUrls.length === 0) {
      setErrorMessage('Informe pelo menos uma URL de imagem (uma por linha).');
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setErrorMessage('Informe uma duração em segundos maior que 0.');
      return;
    }

    if (!Number.isFinite(baseId)) {
      setErrorMessage('O ID base deve ser um número válido.');
      return;
    }

    let extraPayload: Record<string, unknown> = {};
    if (extraPayloadText.trim().length > 0) {
      try {
        extraPayload = JSON.parse(extraPayloadText);
      } catch (error) {
        setErrorMessage(
          'Payload JSON extra inválido: ' + (error as Error).message,
        );
        return;
      }
    }

    setLoadingCreate(true);

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

      const apiJobs = (json.jobs ?? []) as ApiJob[];

      const uiJobs: UiJob[] = apiJobs.map((job, index) => {
        const data = job.data as Record<string, unknown> | undefined;

        let toolkitJobId: string | undefined = undefined;
        if (data && typeof data.job_id === 'string') {
          toolkitJobId = data.job_id;
        }

        let lastStatusMessage: string | undefined = undefined;
        if (data && typeof data.message === 'string') {
          lastStatusMessage = data.message;
        }

        const initialStatus: UiJob['statusStage'] = job.ok
          ? 'processing'
          : 'error';

        const downloadUrl = data ? extractVideoUrl(data) : null;

        return {
          imageUrl: job.imageUrl,
          id: typeof job.id === 'number' ? job.id : index + 1,
          toolkitJobId,
          createStatus: job.status,
          createOk: job.ok,
          createError: job.error,
          statusStage: initialStatus,
          lastStatusMessage,
          downloadUrl,
          rawStatus: undefined,
        };
      });

      setJobs(uiJobs);
    } catch (error) {
      setErrorMessage(
        'Erro de rede ao conversar com o backend: ' +
          (error as Error).message,
      );
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleCheckStatus() {
    if (jobs.length === 0) return;

    const jobIds = jobs
      .map((job) => job.toolkitJobId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (jobIds.length === 0) {
      setErrorMessage(
        'Nenhum job_id encontrado nas respostas. Verifique se o Toolkit está retornando job_id.',
      );
      return;
    }

    setLoadingStatus(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/toolkit/job-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds }),
      });

      const json = (await res.json()) as JobStatusApiResponse;

      if (!res.ok) {
        setErrorMessage(
          json?.error ??
            `Erro ao consultar status dos jobs (status ${res.status}).`,
        );
        return;
      }

      const statuses = json.results ?? [];

      setJobs((prev) =>
        prev.map((job) => {
          if (!job.toolkitJobId) return job;
          const st = statuses.find((s) => s.jobId === job.toolkitJobId);
          if (!st) return job;

          const data = st.data;
          const finished = isStatusFinished(data);
          const videoUrl = data ? extractVideoUrl(data) : null;

          let newStage: UiJob['statusStage'] = job.statusStage;
          if (finished) {
            newStage = st.ok ? 'finished' : 'error';
          } else if (st.ok) {
            newStage = 'processing';
          } else {
            newStage = 'error';
          }

          let lastStatusMessage = job.lastStatusMessage;
          if (
            data &&
            typeof (data as Record<string, unknown>).message === 'string'
          ) {
            lastStatusMessage = (data as Record<string, unknown>)
              .message as string;
          }

          return {
            ...job,
            statusStage: newStage,
            lastStatusMessage,
            downloadUrl: videoUrl ?? job.downloadUrl ?? null,
            rawStatus: data,
          };
        }),
      );
    } catch (error) {
      setErrorMessage(
        'Erro de rede ao consultar status: ' +
          (error as Error).message,
      );
    } finally {
      setLoadingStatus(false);
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
              a partir de uma lista de URLs de imagem e permite consultar o
              status para baixar os vídeos.
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
                Para cada linha de URL, será criado um payload com o formato:{' '}
                <code className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">
                  &#123;&quot;image_url&quot;: &quot;...&quot;,
                  &quot;length&quot;: 15, &quot;id&quot;: &quot;52&quot;,
                  ...&#125;
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
                      <code className="font-mono text-[11px]">length</code> em
                      todos os jobs.
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
                      <code className="font-mono text-[11px]">id</code> igual a
                      este valor (como string), o próximo +1, etc.
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
                    <code className="font-mono text-[11px]">image_url</code>,
                    igual ao que você já usa no n8n.
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
                    Tudo que for definido aqui será mesclado no payload de cada
                    job. Campos{' '}
                    <code className="font-mono text-[11px]">
                      {imageUrlField}
                    </code>
                    ,{' '}
                    <code className="font-mono text-[11px]">length</code> e{' '}
                    <code className="font-mono text-[11px]">id</code> são
                    preenchidos automaticamente.
                  </p>
                </div>

                {/* Botão criar jobs */}
                <div className="pt-2 flex flex-wrap gap-3 items-center">
                  <button
                    type="submit"
                    disabled={loadingCreate}
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingCreate
                      ? 'Criando jobs…'
                      : 'Criar jobs de vídeo'}
                  </button>

                  {jobs.length > 0 && (
                    <button
                      type="button"
                      onClick={handleCheckStatus}
                      disabled={loadingStatus}
                      className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingStatus
                        ? 'Consultando status…'
                        : 'Consultar status dos jobs'}
                    </button>
                  )}
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
  "id": "52",
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
                , remova do payload extra qualquer campo não reconhecido pela
                sua instância da NCA.
              </p>
            </div>
          </aside>
        </div>

        {/* Resultados / downloads */}
        {jobs.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Resultados dos jobs
            </h2>
            <div className="space-y-4">
              {jobs.map((job) => (
                <div
                  key={`${job.imageUrl}-${job.id}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-700">
                        Imagem
                      </span>
                      <p className="font-mono text-xs text-gray-900 break-all">
                        {job.imageUrl}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        id: {job.id}
                        {job.toolkitJobId && (
                          <>
                            {' '}
                            • job_id:{' '}
                            <span className="font-mono">
                              {job.toolkitJobId}
                            </span>
                          </>
                        )}
                      </p>
                      {job.lastStatusMessage && (
                        <p className="mt-1 text-[11px] text-gray-500">
                          status: {job.lastStatusMessage}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                          job.statusStage === 'finished'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.statusStage === 'error'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        }`}
                      >
                        {job.statusStage === 'finished' && 'Finalizado'}
                        {job.statusStage === 'processing' && 'Processando'}
                        {job.statusStage === 'pending' && 'Pendente'}
                        {job.statusStage === 'error' && 'Erro'}
                      </span>

                      {job.downloadUrl && (
                        <a
                          href={job.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-slate-900"
                        >
                          Baixar vídeo
                        </a>
                      )}
                    </div>
                  </div>

                  {job.downloadUrl && (
                    <div className="mt-3">
                      <video
                        src={job.downloadUrl}
                        controls
                        className="w-full max-w-md rounded-md border border-gray-200"
                      />
                    </div>
                  )}

                  {!!job.rawStatus && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-gray-700">
                        Ver status bruto
                      </summary>
                      <pre className="mt-1 max-h-60 overflow-auto rounded bg-gray-900 p-3 text-xs text-green-300">
                        {JSON.stringify(job.rawStatus as any, null, 2)}
                      </pre>
                    </details>
                  )}

                  {job.createError && (
                    <p className="mt-2 text-xs text-red-700">
                      Erro na criação do job: {job.createError}
                    </p>
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
