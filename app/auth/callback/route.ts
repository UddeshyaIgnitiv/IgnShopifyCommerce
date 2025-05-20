// app/auth/callback/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    // TODO: exchange code for access token here using your confidential client credentials

    return NextResponse.json({ message: "Callback received", code, state });
}
