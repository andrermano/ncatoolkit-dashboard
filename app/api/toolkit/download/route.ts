import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const TOOLKIT_API_URL = process.env.TOOLKIT_API_URL;
const TOOLKIT_API_KEY = process.env.TOOLKIT_API_KEY;

if (!TOOLKIT_API_URL || !TOOLKIT_API_KEY) {
  console.error('Missing required environment variables: TOOLKIT_API_URL or TOOLKIT_API_KEY');
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!TOOLKIT_API_URL || !TOOLKIT_API_KEY) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing API credentials' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.url) {
      return NextResponse.json(
        { error: 'Missing required field: url is required' },
        { status: 400 }
      );
    }

    // Forward request to Toolkit API
    const response = await axios.post(
      `${TOOLKIT_API_URL}/v1/media/download`,
      body,
      {
        headers: {
          'X-API-Key': TOOLKIT_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minutes timeout
      }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error('Download API error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.message || error.message || 'Request failed';

      return NextResponse.json(
        {
          error: message,
          details: error.response?.data
        },
        { status }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
