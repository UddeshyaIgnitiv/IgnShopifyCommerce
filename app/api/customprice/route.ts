// app/api/customprice/route.tsx
import { NextRequest, NextResponse } from 'next/server';

// IMPORTANT: These variables must be configured in your .env.local file
const OAUTH_URL = process.env.NEXT_PUBLIC_INFOR_AUTHORIZE_URL;
const PRICES_URL = process.env.NEXT_PUBLIC_INFOR_PRICES_URL;

const CLIENT_ID = process.env.INFOR_CLIENT_ID;
const CLIENT_SECRET = process.env.INFOR_CLIENT_SECRET;
const USERNAME = process.env.INFOR_USERNAME;
const PASSWORD = process.env.INFOR_PASSWORD;

// A simple in-memory cache for the access token.
// In Vercel's serverless environment, this token will persist
// for the lifetime of the serverless function instance.
let tokenCache = {
  access_token: null,
  expires_at: 0
};

/**
 * Fetches or retrieves a cached access token from the OAuth server.
 * This is a standalone utility function that can be used by any API route.
 * @returns {Promise<string>} The valid access token.
 */
async function getAccessToken(): Promise<string> {
  const now = Date.now();
  // Check if the cached token is still valid.
  if (tokenCache.access_token && now < tokenCache.expires_at) {
    console.log("Using cached access token.");
    return tokenCache.access_token;
  }

  // If not valid, fetch a new one.
  try {
    console.log("Fetching new access token...");
    // Use URLSearchParams for a robust way to handle x-www-form-urlencoded data
    const body = new URLSearchParams({
      grant_type: "password",
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      username: USERNAME!,
      password: PASSWORD!,
    });

    if (!OAUTH_URL) {
      throw new Error("OAUTH_URL environment variable is not defined.");
    }

    const response = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OAuth request failed with status ${response.status}: ${errorData}`);
    }

    const { access_token, expires_in } = await response.json();
    tokenCache = {
      access_token,
      expires_at: now + expires_in * 1000 - 5000, // Refresh 5 seconds early
    };

    console.log("Successfully fetched and cached new token.");
    return access_token;
  } catch (error) {
    console.error("Error fetching access token:", error);
    throw new Error("Failed to authenticate with OAuth server.");
  }
}

/**
 * This is the main handler for the POST request to /api/customprice.
 * It follows the Next.js App Router convention for API routes.
 * @param {NextRequest} req The incoming request object.
 * @returns {Promise<NextResponse>} The response object.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Await the token from our caching function.
    const token = await getAccessToken();

    // Parse the request body as JSON.
    const requestBody = await req.json();
    console.log("Request body:", requestBody);

    // Make the API call to the external prices endpoint.
    if (!PRICES_URL) {
      throw new Error("PRICES_URL environment variable is not defined.");
    }
    const response = await fetch(PRICES_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorText = await response.clone().text();
      throw new Error(
        `External API request failed with status ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    // Return the data from the external API as a JSON response.
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    // Centralized error handling for a consistent response.
    console.error("Error in POST /api/customprice:", error);
    return NextResponse.json(
      { error: "Failed to fetch B2B prices", details: (error as Error).message },
      { status: 500 }
    );
  }
}
