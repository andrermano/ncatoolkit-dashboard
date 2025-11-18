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

  const durationRaw =
    typeof body.duration === 'number'
      ? body.duration
      : Number(body.duration);
  const duration =
    Number.isFinite(durationRaw) && durationRaw > 0
      ? durationRaw
      : 15;

  const baseIdRaw =
    typeof body.baseId === 'string'
      ? Number(body.baseId)
      : body.baseId;
  const baseId =
    Number.isFinite(baseIdRaw as number) ? (baseIdRaw as number) : 1;

  const extraPayload =
    (body.extraPayload ?? {}) as Record<string, unknown>;

  const jobs = await Promise.all(
    imageUrls.map(async (imageUrl, index) => {
      // 👉 ID numérico para uso interno / exibição
      const numericId = baseId + index;
      // 👉 ID enviado para a NCA **como string** (requisito do seu endpoint)
      const payloadId = String(numericId);

      const payload: Record<string, unknown> = {
        ...extraPayload,
        [imageUrlField]: imageUrl,
        length: duration,
        id: payloadId, // <- aqui vai string
      };

      try {
        const res = await fetch(
          `${TOOLKIT_API_URL}/v1/image/convert/video`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': TOOLKIT_API_KEY,
            },
            body: JSON.stringify(payload),
          },
        );

        let data: unknown = null;
        try {
          data = await res.json();
        } catch {
          // resposta não-JSON, ignore
        }

        if (!res.ok) {
          return {
            imageUrl,
            id: numericId, // id numérico para você ver no dashboard
            ok: false,
            status: res.status,
            data,
            error:
              (data as any)?.message ??
              `Toolkit retornou status ${res.status}.`,
          };
        }

        return {
          imageUrl,
          id: numericId,
          ok: true,
          status: res.status,
          data,
        };
      } catch (error: any) {
        return {
          imageUrl,
          id: numericId,
          ok: false,
          status: 500,
          error:
            error?.message ??
            'Erro de rede ao chamar a NCA Toolkit API.',
        };
      }
    }),
  );

  return NextResponse.json({ jobs }, { status: 200 });
}
