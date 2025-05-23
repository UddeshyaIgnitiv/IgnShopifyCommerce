// utils/shopify.ts
const SHOPIFY_ADMIN_API_URL = `https://ignitiv-demo-store.myshopify.com/admin/api/2025-04/graphql.json`;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;

export async function shopifyFetch(query: any, variables: Record<string, any>) {
  const queryString = typeof query === 'string' ? query : query.loc?.source.body;

  const response = await fetch(SHOPIFY_ADMIN_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query: queryString, variables }),
  });

  const json = await response.json();
  if (json.errors || json.data?.userErrors?.length > 0) {
    throw new Error(JSON.stringify(json.errors || json.data.userErrors));
  }

  return json.data;
}


