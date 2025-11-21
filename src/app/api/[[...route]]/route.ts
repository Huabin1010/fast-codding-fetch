import { app } from '@/api';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = app.handle;
export const POST = app.handle;
export const PUT = app.handle;
export const DELETE = app.handle;
