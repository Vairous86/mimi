import { NextResponse } from 'next/server';

const VPS_API_URL = 'https://phpcolour.com/social/social1/mimi/api.php';

export async function GET(request: Request) {
  try {
    const res = await fetch(VPS_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json({ error: errorText || 'Failed to fetch database from VPS' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(VPS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorText = await res.text();
      let errorJson;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Ignore parsing error if response is not JSON
      }
      return NextResponse.json(
        errorJson || { error: errorText || 'Failed to execute action on VPS' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
