// /app/api/register-company/route.ts
import { COMPANY_CREATE_MUTATION } from 'lib/shopify/mutations/companyCreate';
import { shopifyFetch } from 'lib/shopify_service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      externalId,
      locationName,
      address1,
      city,
      province,
      zip,
      country,
    } = body;

    const errors: { field: string; message: string }[] = [];

    if (!name) errors.push({ field: 'name', message: 'Company name is required.' });
    // if (!externalId) errors.push({ field: 'externalId', message: 'External ID is required.' });
    if (!locationName) errors.push({ field: 'locationName', message: 'Location name is required.' });
    if (!address1) errors.push({ field: 'address1', message: 'Address Line 1 is required.' });
    if (!city) errors.push({ field: 'city', message: 'City is required.' });
    if (!province) errors.push({ field: 'province', message: 'Province/State is required.' });
    if (!zip) errors.push({ field: 'zip', message: 'ZIP/Postal Code is required.' });
    if (!country) errors.push({ field: 'country', message: 'Country is required.' });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const companyCreateVariables = {
      input: {
        company: {
          name,
          externalId,
        },
        companyLocation: {
          name: locationName,
          shippingAddress: {
            address1,
            city,
            zoneCode: province,
            zip,
            countryCode: country,
          },
          billingSameAsShipping: true,
        },
      },
    };

    const data = await shopifyFetch(COMPANY_CREATE_MUTATION, companyCreateVariables);

    const userErrors = data?.companyCreate?.userErrors ?? [];

    if (data.errors || userErrors.length > 0) {
      const formattedErrors = [...(data.errors || []), ...userErrors].map((err: any) => ({
        field: err.field?.[0] || 'unknown',
        message: err.message,
      }));

      return NextResponse.json({ error: formattedErrors }, { status: 400 });
    }

    return NextResponse.json({
      message: '✅ Company created successfully!',
      company: data.companyCreate.company,
    });

  } catch (error: unknown) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      {
        error: [{ field: 'server', message: error instanceof Error ? error.message : 'Unexpected error' }],
      },
      { status: 500 }
    );
  }
}
