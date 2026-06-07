import { NextRequest } from 'next/server';
import { runAnalysis } from '@/lib/trends';
import type { AnalysisConfig } from '@/types/analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sse(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  const configParam = request.nextUrl.searchParams.get('config');
  if (!configParam) {
    return new Response('Missing config parameter', { status: 400 });
  }

  let config: AnalysisConfig;
  try {
    config = JSON.parse(decodeURIComponent(atob(configParam)));
  } catch {
    return new Response('Invalid config parameter', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(sse(data)));
        } catch {
          // client disconnected
        }
      };

      try {
        const result = await runAnalysis(config, (pct, message) => {
          enqueue({ type: 'progress', pct, message });
        });
        enqueue({ type: 'done', result });
      } catch (err) {
        enqueue({ type: 'error', message: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
