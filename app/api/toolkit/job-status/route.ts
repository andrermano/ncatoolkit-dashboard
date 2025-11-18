import { NextRequest, NextResponse } from 'next/server';

const TOOLKIT_API_URL = process.env.TOOLKIT_API_URL;
const TOOLKIT_API_KEY = process.env.TOOLKIT_API_KEY;

if (!TOOLKIT_API_URL || !TOOLKIT_API_KEY) {
  // Isso explode no build se as env não existirem
  throw new Error(
    'Missing TOOLKIT_API_URL or TOOLKIT_API_KEY environment variables',
  );
}

type IncomingJob = {
  id: string;
  jobId: string;
  imageUrl?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const jobs = (body.jobs || []) as IncomingJob[];

    if (!Array.isArray(jobs) || jobs.length === 0) {
      return NextResponse.json(
        { error: 'Body must include a non-empty "jobs" array' },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      jobs.map(async (job) => {
        try {
          const url = `${TOOLKIT_API_URL}/v1/toolkit/job/status?job_id=${encodeURIComponent(
            job.jobId,
          )}`;

          const res = await fetch(url, {
            method: 'GET',
            headers: {
              'x-api-key': TOOLKIT_API_KEY,
            },
          });

          const data = await res.json();

          // status / message genérico
          const statusText =
            (data.status as string | undefined) ??
            (data.message as string | undefined) ??
            'unknown';

          const statusLower = statusText.toLowerCase();

          // Tentativa genérica de identificar término:
          const isFinished =
            statusLower.includes('complete') ||
            statusLower.includes('finished') ||
            statusLower.includes('done') ||
            statusLower.includes('error') ||
            statusLower.includes('failed') ||
            data.code === 200;

          // Tentativa genérica de localizar a URL do vídeo gerado
          const downloadUrl =
            (data.output_url as string | undefined) ??
            (data.video_url as string | undefined) ??
            (data.media_url as string | undefined) ??
            (data.file_url as string | undefined) ??
            null;

          return {
            id: job.id,
            jobId: job.jobId,
            imageUrl: job.imageUrl,
            ok: res.ok,
            httpStatus: res.status,
            status: statusText,
            isFinished,
            downloadUrl,
            data,
          };
        } catch (err: any) {
          return {
            id: job.id,
            jobId: job.jobId,
            imageUrl: job.imageUrl,
            ok: false,
            httpStatus: 500,
            status: 'error',
            isFinished: true,
            downloadUrl: null,
            error: err?.message ?? 'Unknown error',
          };
        }
      }),
    );

    return NextResponse.json({ jobs: results }, { status: 200 });
  } catch (err: any) {
    console.error('Error in /api/toolkit/job-status:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Unexpected error' },
      { status: 500 },
    );
  }
}
