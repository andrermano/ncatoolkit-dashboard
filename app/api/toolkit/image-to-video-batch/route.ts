// app/api/toolkit/image-to-video-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';

const TOOLKIT_API_URL = process.env.TOOLKIT_API_URL;
const TOOLKIT_API_KEY = process.env.TOOLKIT_API_KEY;

type BatchRequestBody = {
  imageUrls: string[];
  imageUrlField: string; // ex.: "image_url"
  payloadTemplate: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  if (!TOOLKIT_API_URL || !TOOLKIT_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Missing TOOLKIT_API_URL or TOOLKIT_API_KEY on the server. Configure estas variáveis no container.',
      },
      { status: 500 },
    );
  }

  let body: BatchRequestBody;

  try {
    body = (await req.json()) as BatchRequestBody;
  } catch {
    return NextResponse.json(
      { error: 'Body inválido. Envie um JSON válido.' },
      { status: 400 },
    );
  }

  const { imageUrls, imageUrlField, payloadTemplate } = body;

  if (!imageUrls || imageUrls.length === 0) {
    return NextResponse.json(
      { error: 'Informe pelo menos uma URL de imagem.' },
      { status: 400 },
    );
  }

  if (!imageUrlField) {
    return NextResponse.json(
      {
        error:
          'Campo "imageUrlField" é obrigatório (ex.: "image_url", conforme a doc do NCA Toolkit).',
      },
      { status: 400 },
    );
  }

  if (!payloadTemplate || typeof payloadTemplate !== 'object') {
    return NextResponse.json(
      {
        error:
          '"payloadTemplate" deve ser um objeto JSON com o restante dos parâmetros exigidos pelo endpoint.',
      },
      { status: 400 },
    );
  }

  const baseUrl = TOOLKIT_API_URL.replace(/\/$/, '');
  const endpoint = `${baseUrl}/v1/image/convert/video`;

  const results: Array<{
    imageUrl: string;
    ok: boolean;
    status: number;
    data?: unknown;
    error?: string;
  }> = [];

  for (const imageUrl of imageUrls) {
    const payload = {
      ...payloadTemplate,
      [imageUrlField]: imageUrl,
    };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TOOLKIT_API_KEY,
        },
        body: JSON.stringify(payload),
      });

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        // se não for JSON, ignoramos
      }

      results.push({
        imageUrl,
        ok: res.ok,
        status: res.status,
        data,
      });
    } catch (err) {
      results.push({
        imageUrl,
        ok: false,
        status: 0,
        error: (err as Error).message,
      });
    }
  }

  return NextResponse.json({ results });
}
