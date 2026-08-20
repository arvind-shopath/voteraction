import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBooths } from '@/app/actions/booth';
import { getWorkersInAssembly } from '@/app/actions/worker';

export async function GET() {
  const session = await auth();
  const booths = await getBooths();
  const workers = await getWorkersInAssembly();
  return NextResponse.json({
    session,
    boothsCount: booths?.length,
    workersCount: workers?.length,
    boothsSample: booths?.slice(0, 2),
    workersSample: workers
  });
}
