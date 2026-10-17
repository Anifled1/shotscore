'use client';

import { useRef, useState } from 'react';
import type { GradeResult } from '@/lib/grade';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'getshotscore.com';

type GradeResponse = GradeResult & { mock?: boolean };

export default function Home() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<GradeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG / JPG / WebP).');
      return;
    }
    setError(null);
    setResult(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    setImage(dataUrl);
  }

  async function grade() {
    if (!image || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });
      const data = (await res.json()) as GradeResponse & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Grading failed.');
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grading failed.');
    } finally {
      setLoading(false);
    }
  }

  function scoreColor(score: number) {
    if (score >= 70) return '#34d399';
    if (score >= 50) return '#fbbf24';
    return '#f87171';
  }

  // 1200x630 so the downloaded card doubles as an OG image when shared on X.
  function downloadScorecard() {
    if (!result) return;
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0b0f1a';
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('ShotScore', 60, 90);
    ctx.fillStyle = '#8b93a7';
    ctx.font = '24px sans-serif';
    ctx.fillText('Product main image report', 60, 128);

    ctx.fillStyle = scoreColor(result.total);
    ctx.font = 'bold 150px sans-serif';
    ctx.fillText(String(result.total), 820, 340);
    ctx.fillStyle = '#8b93a7';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('/100', 1010, 340);

    let y = 210;
    for (const c of result.criteria) {
      ctx.fillStyle = '#8b93a7';
      ctx.font = '22px sans-serif';
      ctx.fillText(`${c.label}  ${c.score}`, 60, y);
      ctx.fillStyle = '#1f2637';
      ctx.fillRect(60, y + 10, 560, 12);
      ctx.fillStyle = '#6366f1';
      ctx.fillRect(60, y + 10, (560 * c.score) / 100, 12);
      y += 62;
    }

    ctx.fillStyle = '#566076';
    ctx.font = '20px sans-serif';
    ctx.fillText(`${SITE} — free AI main image grader`, 60, 590);

    const link = document.createElement('a');
    link.download = 'shotscore-report.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <main className="container">
      <h1>ShotScore</h1>
      <p className="sub">
        Free AI grader for your product main image — Amazon, TikTok Shop or your own store.
        Upload, get a score out of 100, share the report card.
      </p>

      <div
        className={`dropzone${dragOver ? ' over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void loadFile(e.dataTransfer.files[0]);
        }}
      >
        <p>{image ? 'Choose another image' : 'Drop your main image here, or click to browse'}</p>
        {image && <img className="preview" src={image} alt="Product main image preview" />}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => void loadFile(e.target.files?.[0])}
        />
      </div>

      <button className="btn" onClick={() => void grade()} disabled={!image || loading}>
        {loading ? 'Grading…' : 'Grade my image'}
      </button>
      {error && <p className="error">{error}</p>}

      {result && (
        <section className="card">
          <div className="total" style={{ color: scoreColor(result.total) }}>
            {result.total}
            <span style={{ fontSize: 20, color: '#8b93a7' }}> /100</span>
          </div>
          {result.criteria.map((c) => (
            <div key={c.key} style={{ marginTop: 16 }}>
              <div>
                {c.label} — {c.score}
              </div>
              <div className="bar">
                <div style={{ width: `${c.score}%`, background: scoreColor(c.score) }} />
              </div>
              <p className="finding">{c.finding}</p>
            </div>
          ))}
          <h3 style={{ marginTop: 20 }}>Top fixes</h3>
          <ul className="fixes">
            {result.fixes.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <button className="btn ghost" onClick={downloadScorecard}>
            Download shareable scorecard
          </button>
        </section>
      )}

      <p className="footer">
        No signup. Your image is graded and discarded, never stored. — {SITE}
      </p>
    </main>
  );
}
