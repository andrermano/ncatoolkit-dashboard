// app/api/toolkit/image-to-video-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TOOLKIT_API_URL = process.env.TOOLKIT_API_URL;
const TOOLKIT_API_KEY = process.env.TOOLKIT_API_KEY;

type BatchRequestBody = {
  imageUrls: string[];
  imageUrlField?: string;
  duration?: number;
  baseId?: number | string;
  extraPayload?: Record<string, unknown>;
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

  let body: BatchRequestBody;
  try {
    body = (await req.json()) as BatchRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Body JSON inválido.' },
      { status: 400 },
    );
  }

  const imageUrls = Array.isArray(body.imageUrls) ? body.imageUrls : [];
  if (imageUrls.length === 0) {
    return NextResponse.json(
      {
        error:
          'imageUrls deve ser um array com pelo menos 1 URL de imagem.',
      },
      { status: 400 },
    );
  }

  const imageUrlField = body.imageUrlField || 'image_url';

  const durat
