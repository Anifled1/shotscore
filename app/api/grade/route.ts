import { NextRequest, NextResponse } from 'next/server';
import { mockGrade, RUBRIC, type GradeResult } from '@/lib/grade';

const MAX_BODY_BYTES = 8 * 1024 * 1024;

type VisionMessage = {
  role: 'system' | 'user';
  content:
    | string
    | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
};

const SYSTEM_PROMPT = `You are a strict e-commerce photography director grading a marketplace product MAIN image — the thumbnail buyers see in Amazon / TikTok Shop search results at ~120px.

Grade each criterion 0-100:
- impact: does it stop the scroll as a tiny thumbnail? strong contrast, clear hero product
- subject: product fills ~85% of the frame, not floating tiny in whitespace
- background: clean, marketplace-appropriate (pure white for Amazon), no clutter
- compliance: marketplace main-image rules — pure white background, no text, no logos, no watermarks, no borders, no props or badges
- mobile: legible and recognizable at small sizes
- text: zero text clutter on the image

Be harsh — a median real-world main image scores ~45. Findings must cite what is actually visible in this image, never generic advice.

Respond with ONLY this JSON object, no markdown fences:
{"criteria":[{"key":"impact","label":"Visual impact","score":<int 0-100>,"finding":"<one concrete sentence>"},<repeat for subject, background, compliance, mobile, text>],"fixes":["<fix 1>","<fix 2>","<fix 3>"]}`;

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

function parseGrade(raw: string): GradeResult | null {
  const jsonText = raw.replace(/```(?:json)?/g, '').trim();
  let data: unknown;
  try {
    data = JSON.parse(jsonText);
  } catch {
    return null;
  }
  const rawCriteria = (data as { criteria?: unknown }).criteria;
  if (!Array.isArray(rawCriteria)) return null;

  const byKey = new Map<string, { score: number; finding: string }>();
  for (const c of rawCriteria) {
    const key = String((c as { key?: unknown }).key ?? '');
    if (RUBRIC.some((r) => r.key === key)) {
      byKey.set(key, {
        score: clampScore((c as { score?: unknown }).score),
        finding: String((c as { finding?: unknown }).finding ?? ''),
      });
    }
  }
  if (byKey.size !== RUBRIC.length) return null;

  const criteria = RUBRIC.map((r) => ({
    key: r.key,
    label: r.label,
    score: byKey.get(r.key)!.score,
    finding: byKey.get(r.key)!.finding,
  }));
  const total = Math.round(
    criteria.reduce(
      (sum, c) => sum + c.score * (RUBRIC.find((r) => r.key === c.key)?.weight ?? 0),
      0,
    ),
  );

  const rawFixes = (data as { fixes?: unknown }).fixes;
  const fixes = Array.isArray(rawFixes)
    ? rawFixes.map((f) => String(f)).slice(0, 3)
    : [];
  return { total, criteria, fixes };
}

async function gradeWithVisionModel(image: string): Promise<GradeResult> {
  const apiKey = process.env.GRADE_API_KEY!;
  const baseUrl = process.env.GRADE_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.GRADE_MODEL || 'deepseek-flash';

  const messages: VisionMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Grade this product main image.' },
        { type: 'image_url', image_url: { url: image } },
      ],
    },
  ];

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, temperature: 0, messages }),
  });
  if (!res.ok) {
    throw new Error(`Grader API error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Grader API returned no content');
  const graded = parseGrade(content);
  if (!graded) throw new Error('Grader returned unparseable JSON');
  return graded;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const image = (body as { image?: unknown } | null)?.image;

  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return NextResponse.json({ error: 'Invalid image payload.' }, { status: 400 });
  }
  if (image.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Image too large. Max ~6MB.' }, { status: 413 });
  }

  // No key configured → mock mode (local dev before the API key exists).
  if (!process.env.GRADE_API_KEY) {
    const result = mockGrade();
    return NextResponse.json({ ...result, mock: true });
  }

  try {
    const result = await gradeWithVisionModel(image);
    return NextResponse.json(result);
  } catch (e) {
    console.error('grade failed:', e);
    return NextResponse.json(
      { error: 'Grader is unavailable right now. Please retry.' },
      { status: 502 },
    );
  }
}
