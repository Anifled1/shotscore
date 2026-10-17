export type CriterionScore = {
  key: string;
  label: string;
  score: number; // 0-100
  finding: string;
};

export type GradeResult = {
  total: number; // 0-100, weighted
  criteria: CriterionScore[];
  fixes: string[]; // top 3 concrete suggestions
};

// Weights must sum to 1. Keep in sync with PROJECT.md rubric.
export const RUBRIC: { key: string; label: string; weight: number }[] = [
  { key: 'impact', label: 'Visual impact', weight: 0.25 },
  { key: 'subject', label: 'Subject fill', weight: 0.2 },
  { key: 'background', label: 'Background cleanliness', weight: 0.15 },
  { key: 'compliance', label: 'Marketplace compliance', weight: 0.15 },
  { key: 'mobile', label: 'Mobile readability', weight: 0.15 },
  { key: 'text', label: 'No text clutter', weight: 0.1 },
];

/** Placeholder until a vision model is wired into /api/grade. */
export function mockGrade(): GradeResult {
  const criteria: CriterionScore[] = RUBRIC.map(({ key, label }) => ({
    key,
    label,
    score: 40 + Math.floor(Math.random() * 45),
    finding: 'Mock grading — wire a vision model in app/api/grade/route.ts.',
  }));
  const total = Math.round(
    criteria.reduce(
      (sum, c) => sum + c.score * (RUBRIC.find((r) => r.key === c.key)?.weight ?? 0),
      0,
    ),
  );
  return {
    total,
    criteria,
    fixes: [
      'Fill ~85% of the frame with the product. (mock)',
      'Remove text overlays and badges from the main image. (mock)',
      'Re-shoot on a pure white background. (mock)',
    ],
  };
}
