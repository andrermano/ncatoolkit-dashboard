'use client';

import { useState } from 'react';
import {
  Image as ImageIcon,
  Video,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  Link as LinkIcon,
} from 'lucide-react';

type RawJobResponse = {
  imageUrl: string;
  id: number | string;
  ok: boolean;
  status: number;
  data?: any;
  error?: string;
};

type JobStatus =
  | 'queued'
  | 'processing'
  | 'completed'
  | 'error'
  | 'unknown';

type Job = {
  localId: string;          // ID interno que usamos no dashboard (1, 2, 3…)
  imageUrl: string;
  apiStatusCode: number;    // status HTTP do /v1/image/convert/video
  initialResponse: any;     // resposta bruta da criação do job
  toolkitJobId?: string;    // job_id do Toolkit
  status: JobStatus;
  statusMessage?: string;
  isFinished: boolean;
  downloadUrl?: string | null;
  error?: string;
  latestStatusRaw?: any;    // última resposta do /v1/toolkit/job/status
};

type JobsApiResponse = {
  jobs: RawJobResponse[];
};

type JobStatusApiResponse = {
  jobs: {
    id: string;
    jobId: string;
    imageUrl?: string;
    ok: boolean;
    httpStatus: number;
    status: string;
    isFinished: boolean;
    downloadUrl?: string | null;
    data?: any;
    error?: string;
  }[];
};

export default function ImageToVideoPage() {
  const [folderUrl, setFolderUrl] = useState(
    'https://storage.googleapis.com/nca-toolkit-manodread/Religioso/Video16-ER5',
  );
  const [prefix, setPrefix] = useState('cena_');
  const [suffix, setSuffix] = useState('.png');
  const [padding, setPadding] = useState(2); // "01", "02", etc.
  const [startIndex, setStartIndex] = useState(1);
  const [endIndex, setEndIndex] = useState(4);
  const [lengthSeconds, setLengthSeconds] = useState(15);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalFrames =
    endIndex >= startIndex ? endIndex - startIndex + 1 : 0;

  function buildImageUrl(index: number) {
    const padded = String(index).padStart(padding, '0');
    const base = folderUrl.replace(/\/+$/, '');
    return `${base}/${prefix}${padded}${suffix}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setJobs([]);

    if (endIndex < startIndex) {
      setErrorMessage('O índice final deve ser maior ou igual ao inicial.');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        folderUrl,
        prefix,
        suffix,
        padding,
        startIndex,
        endIndex,
        length: lengthSeconds,
      };

      const res = await fetch('/api/toolkit/image-to-video-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error ??
            `Erro ao criar jobs. Status: ${res.status}`,
        );
      }

      const data = (await res.json()) as JobsApiResponse;

      const initialJobs: Job[] = (data.jobs || []).map((j) => {
        const localId = String(j.id);
        const jobId =
          j.data?.job_id ??
          j.data?.jobId ??
          j.data?.jobID ??
          undefined;

        const message =
          (j.data?.message as string | undefined) ??
          (j.data?.status as string | undefined) ??
          (j.ok ? 'processing' : 'error');

        const hasError = !j.ok;

        return {
          localId,
          imageUrl: j.imageUrl,
          apiStatusCode: j.status,
          initialResponse: j.data,
          toolkitJobId: jobId,
          status: hasError ? 'error' : 'processing',
          statusMessage: message,
          isFinished: hasError, // se já deu erro, não precisa poll
          error: j.error,
          downloadUrl: null,
        };
      });

      setJobs(initialJobs);

      // assim que criar os jobs, já começa a monitorar até concluir
      await monitorJobs(initialJobs);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err?.message ??
          'Erro inesperado ao criar jobs. Verifique o console.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function monitorJobs(initialJobs?: Job[]) {
    const jobsToTrack = initialJobs ?? jobs;

    if (!jobsToTrack.length) return;

    // se nenhum job tem jobId, não há o que monitorar
    if (!jobsToTrack.some((j) => j.toolkitJobId)) {
      return;
    }

    setIsPolling(true);

    try {
      let currentJobs = [...jobsToTrack];

      while (true) {
        const pending = currentJobs.filter(
          (j) => !j.isFinished && j.toolkitJobId,
        );

        if (!pending.length) break;

        const res = await fetch('/api/toolkit/job-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobs: pending.map((j) => ({
              id: j.localId,
              jobId: j.toolkitJobId!,
              imageUrl: j.imageUrl,
            })),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error('Erro ao consultar status dos jobs:', data);
          throw new Error(
            data.error ??
              `Erro ao consultar status dos jobs. Status: ${res.status}`,
          );
        }

        const statusData = (await res.json()) as JobStatusApiResponse;

        const updatedJobs = currentJobs.map((job) => {
          const statusJob = statusData.jobs.find(
            (s) => s.id === job.localId,
          );
          if (!statusJob) return job;

          const statusText = statusJob.status ?? 'unknown';
          const lower = statusText.toLowerCase();

          const isFinished =
            statusJob.isFinished ??
            lower.includes('complete') ||
              lower.includes('finished') ||
              lower.includes('done') ||
              lower.includes('error') ||
              lower.includes('failed');

          let status: JobStatus = job.status;
          if (isFinished) {
            status = lower.includes('error')
              ? 'error'
              : 'completed';
          } else {
            status = 'processing';
          }

          return {
            ...job,
            status,
            statusMessage: statusText,
            isFinished,
            downloadUrl:
              statusJob.downloadUrl ?? job.downloadUrl ?? null,
            latestStatusRaw: statusJob.data,
            error: statusJob.error ?? job.error,
          };
        });

        currentJobs = updatedJobs;
        setJobs(updatedJobs);

        const allFinished = updatedJobs.every((j) => j.isFinished);
        if (allFinished) break;

        // espera 5s antes da próxima rodada
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err?.message ??
          'Erro ao monitorar o status dos jobs. Veja o console.',
      );
    } finally {
      setIsPolling(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* topo */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Video className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">
                Image → Video Batch
              </h1>
              <p className="text-xs text-slate-400">
                Gera vídeos do No-Code Architects Toolkit a partir
                de uma sequência de imagens.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            <span className="rounded-full bg-slate-900/70 px-3 py-1">
              Dashboard v1.2.0
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* card principal */}
        <section className="grid gap-6 lg:grid-cols-[2fr,3fr]">
          {/* formulário */}
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/40"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">
                  Configuração das imagens
                </h2>
                <p className="text-xs text-slate-400">
                  Usa padrão de nome como{' '}
                  <span className="font-mono">
                    cena_01.png, cena_02.png...
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Pasta base (GCS / S3 / HTTP)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none ring-blue-500/50 focus:border-blue-500 focus:ring-1"
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                placeholder="https://storage.googleapis.com/..."
              />

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Prefixo
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none ring-blue-500/50 focus:border-blue-500 focus:ring-1"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Sufixo / extensão
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none ring-blue-500/50 focus:border-blue-500 focus:ring-1"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Zero padding
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none ring-blue-500/50 focus:border-blue-500 focus:ring-1"
                    value={padding}
                    onChange={(e) =>
                      setPadding(Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Índice inicial
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none ring-blue-500/50 focus:border-blue-500 focus:ring-1"
                    value={startIndex}
                    onChange={(e) =>
                      setStartIndex(Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Índice final
                  </label>
                  <input
                    type="number"
                    min={startIndex}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none ring-blue-500/50 focus:border-blue-500 focus:ring-1"
                    value={endIndex}
                    onChange={(e) =>
                      setEndIndex(Number(e.target.value) || 0)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300">
                    Duração (s)
                  </label>
                  <input
                    type="number"
                    min={1}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs outline-none ring-blue-500/50 focus:border-blue-500 focus:ring-1"
                    value={lengthSeconds}
                    onChange={(e) =>
                      setLengthSeconds(Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Frames: {totalFrames || 0}{' '}
                  {totalFrames > 0 && (
                    <>
                      · Tempo total ~
                      {totalFrames * lengthSeconds}s
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="rounded-full bg-slate-900 px-2 py-0.5">
                  Exemplo:{' '}
                  <span className="font-mono">
                    {buildImageUrl(startIndex)}
                  </span>
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-xs text-red-100">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando jobs...
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Enviar e aguardar vídeos
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => monitorJobs()}
                disabled={isPolling || !jobs.length}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-medium text-slate-200 hover:border-blue-500 hover:text-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPolling ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Monitorando status...
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Consultar status novamente
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-slate-500">
              Esta página envia um job para cada imagem usando o
              endpoint <code>/v1/image/convert/video</code> e, em
              seguida, consulta <code>/v1/toolkit/job/status</code>{' '}
              até o vídeo ficar pronto.
            </p>
          </form>

          {/* painel de resultados */}
          <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">
                    Resultados dos jobs
                  </h2>
                  <p className="text-xs text-slate-400">
                    Veja o status e faça o download dos vídeos
                    gerados.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] text-slate-400">
                {jobs.length} job(s)
              </span>
            </div>

            {!jobs.length && (
              <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 text-center text-sm text-slate-500">
                <Video className="h-8 w-8 text-slate-600" />
                <div>
                  Nenhum job ainda.
                  <br />
                  Configure as imagens e clique em{' '}
                  <span className="font-medium">
                    “Enviar e aguardar vídeos”
                  </span>
                  .
                </div>
              </div>
            )}

            {!!jobs.length && (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.localId}
                    className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-xs md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex flex-1 items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-slate-200">
                        {job.status === 'completed' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : job.status === 'error' ? (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300">
                            #{job.localId}
                          </span>
                          <span className="truncate text-[11px] text-slate-300">
                            {job.imageUrl}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          <span>
                            Status:{' '}
                            <span className="font-medium">
                              {job.statusMessage ?? job.status}
                            </span>
                          </span>
                          {job.toolkitJobId && (
                            <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-500">
                              job_id: {job.toolkitJobId}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            HTTP {job.apiStatusCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-2 md:w-52">
                      {job.downloadUrl && (
                        <a
                          href={job.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-emerald-500"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Baixar vídeo
                        </a>
                      )}

                      {!job.downloadUrl && job.status === 'completed' && (
                        <span className="rounded-lg border border-amber-500/50 bg-amber-950/40 px-3 py-2 text-[11px] text-amber-100">
                          Vídeo concluído, mas a URL não foi encontrada
                          na resposta. Veja o JSON bruto.
                        </span>
                      )}

                      <details className="group rounded-lg border border-slate-800 bg-slate-950/80 text-[10px] text-slate-300">
                        <summary className="flex cursor-pointer items-center justify-between px-3 py-1.5">
                          <span className="flex items-center gap-1.5">
                            <LinkIcon className="h-3 w-3 text-slate-400" />
                            JSON da API
                          </span>
                          <span className="text-slate-500 group-open:hidden">
                            Ver
                          </span>
                          <span className="hidden text-slate-500 group-open:inline">
                            Fechar
                          </span>
                        </summary>
                        <div className="max-h-48 overflow-auto border-t border-slate-800 bg-slate-950 px-3 py-2 font-mono text-[9px] leading-snug text-slate-300">
                          {JSON.stringify(
                            job.latestStatusRaw ?? job.initialResponse,
                            null,
                            2,
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
