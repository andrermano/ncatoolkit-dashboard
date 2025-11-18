import { NextRequest, NextResponse } from 'next/server';

const TOOLKIT_API_URL = process.env.TOOLKIT_API_URL;
const TOOLKIT_API_KEY = process.env.TOOLKIT_API_KEY;

type JobStatusRequestBody = {
  jobIds: string[]; // lista de job_id que vieram do /image/convert/video
};

export async function POST(req: NextRequest) {
  if (!TOOLKIT_API_URL || !TOOLKIT_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Missing TOOLKIT_API_URL ou TOOLKIT_API_KEY no servidor. Configure estas variáveis no container.',
      },
      { status: 500 },
    );
  }

  const apiUrl = TOOLKIT_API_URL as string;
  const apiKey = TOOLKIT_API_KEY as string;

  let body: JobStatusRequestBody;
  try {
    body = (await req.json()) as JobStatusRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Body JSON inválido.' },
      { status: 400 },
    );
  }

  const jobIds = Array.isArray(body.jobIds)
    ? body.jobIds
        .map((j) => (j ?? '').toString().trim())
        .filter((v) => v.length > 0)
    : [];

  if (jobIds.length === 0) {
    return NextResponse.json(
      {
        error: 'jobIds deve ser um array com pelo menos 1 job_id.',
      },
      { status: 400 },
    );
  }

  const statuses = await Promise.all(
    jobIds.map(async (jobId) => {
      try {
        // 🔧 IMPORTANTE: Toolkit job/status é POST com JSON { job_id }
        const res = await fetch(`${apiUrl}/v1/toolkit/job/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          } as Record<string, string>,
          body: JSON.stringify({ job_id: jobId }),
        });

        let data: unknown = undefined;
        try {
          data = await res.json();
        } catch {
          // se não for JSON, mantém data = undefined
        }

        if (!res.ok) {
          return {
            jobId,
            ok: false,
            status: res.status,
            data,
            error:
              (data as any)?.message ??
              (data as any)?.error ??
              `Toolkit retornou status ${res.status}.`,
          };
        }

        return {
          jobId,
          ok: true,
          status: res.status,
          data,
        };
      } catch (error: any) {
        return {
          jobId,
          ok: false,
          status: 500,
          error:
            error?.message ??
            'Erro de rede ao consultar status no Toolkit.',
        };
      }
    }),
  );

  // ⚠️ Mantendo o nome "statuses" porque o frontend usa json.statuses
  return NextResponse.json({ statuses }, { status: 200 });
}
