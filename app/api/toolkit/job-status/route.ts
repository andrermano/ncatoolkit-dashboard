import { NextRequest, NextResponse } from 'next/server';

const TOOLKIT_API_URL = process.env.TOOLKIT_API_URL;
const TOOLKIT_API_KEY = process.env.TOOLKIT_API_KEY;

type JobStatusRequestBody = {
  jobIds: string[]; // lista de job_id que vieram do /image/convert/video
};

type JobStatusResult = {
  jobId: string;
  ok: boolean;
  status: number;
  data?: unknown;
  error?: string;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Garantir que as envs existem
  if (!TOOLKIT_API_URL || !TOOLKIT_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Missing TOOLKIT_API_URL ou TOOLKIT_API_KEY no servidor. Configure estas variáveis no container.',
      },
      { status: 500 },
    );
  }

  let body: JobStatusRequestBody;

  // Parse seguro do body
  try {
    const json = (await req.json()) as Partial<JobStatusRequestBody>;

    body = {
      jobIds: Array.isArray(json.jobIds) ? json.jobIds : [],
    };
  } catch {
    return NextResponse.json(
      { error: 'Body JSON inválido.' },
      { status: 400 },
    );
  }

  // Limpeza e garantia de string[]
  const jobIds: string[] = body.jobIds
    .map((id) => String(id).trim())
    .filter((id) => id.length > 0);

  if (jobIds.length === 0) {
    return NextResponse.json(
      {
        error:
          'jobIds deve ser um array com pelo menos 1 job_id.',
      },
      { status: 400 },
    );
  }

  const results: JobStatusResult[] = await Promise.all(
    jobIds.map(async (jobId) => {
      const url = `${TOOLKIT_API_URL}/v1/toolkit/job/status?job_id=${encodeURIComponent(
        jobId,
      )}`;

      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'x-api-key': TOOLKIT_API_KEY,
          },
          cache: 'no-store',
        });

        let data: unknown;

        try {
          data = await res.json();
        } catch {
          data = undefined; // Caso o Toolkit não retorne JSON
        }

        if (!res.ok) {
          const message =
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof (data as any).message === 'string'
              ? (data as any).message
              : `Toolkit retornou status ${res.status}.`;

          return {
            jobId,
            ok: false,
            status: res.status,
            data,
            error: message,
          };
        }

        return {
          jobId,
          ok: true,
          status: res.status,
          data,
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao consultar status no Toolkit.';

        return {
          jobId,
          ok: false,
          status: 500,
          error: message,
        };
      }
    }),
  );

  return NextResponse.json({ results }, { status: 200 });
}
