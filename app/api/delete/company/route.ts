// app/api/companies/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-04';

export async function POST(req: NextRequest) {
  try {
    const { companyIds } = await req.json();

    if (!companyIds || !Array.isArray(companyIds)) {
      return NextResponse.json(
        { error: 'companyIds must be an array of Shopify GIDs.' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VER}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
        },
        body: JSON.stringify({
          query: `
            mutation companiesDelete($companyIds: [ID!]!) {
              companiesDelete(companyIds: $companyIds) {
                deletedCompanyIds
                userErrors {
                  field
                  message
                }
              }
            }
          `,
          variables: {
            companyIds,
          },
        }),
      }
    );

    const result = await response.json();
    console.log('Company delete result:', result);

    if (
      result.errors ||
      result.data?.companiesDelete?.userErrors?.length > 0
    ) {
      return NextResponse.json({ error: result }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      deletedCompanyIds: result.data.companiesDelete.deletedCompanyIds,
    });
  } catch (error) {
    console.error('Company delete error:', error);
    return NextResponse.json(
      { error: 'Something went wrong while deleting companies.' },
      { status: 500 }
    );
  }
}
