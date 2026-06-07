import { NextRequest } from 'next/server';
import { runAnalysis } from '@/lib/trends';
import type { AnalysisConfig } from '@/types/analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const config: AnalysisConfig = await request.json();
    const result = await runAnalysis(config, () => {});
    return Response.json(result);
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
