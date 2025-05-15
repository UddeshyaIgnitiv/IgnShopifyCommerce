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

    // Validate required fields
    if (
      !name ||
      !externalId ||
      !locationName ||
      !address1 ||
      !city ||
      !province ||
      !zip ||
      !country
    ) {
      return NextResponse.json(
        { error: [{ message: 'Company name, externalId, and full address fields are required.' }] },
        { status: 400 }
      );
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

     // Calling Shopify API to create the company
     const data = await shopifyFetch(COMPANY_CREATE_MUTATION, companyCreateVariables);

     //console.log("data to create the company", data);
    const userErrors = data?.companyCreate?.userErrors ?? [];
    if (data.errors || userErrors.length > 0) {
      return NextResponse.json(
        { error: data.errors || userErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: '✅ Company created successfully!',
      company: data.companyCreate.company,
    });

  } catch (error: unknown) {
    console.error('Error creating company:', error);
    return NextResponse.json(
      {
        error: [{ message: error instanceof Error ? error.message : 'Unexpected error' }],
      },
      { status: 500 }
    );
  }
}

