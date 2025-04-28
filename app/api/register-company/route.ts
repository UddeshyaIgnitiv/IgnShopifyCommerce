import { NextResponse } from 'next/server';

const SHOPIFY_ADMIN_API_URL = `https://ignitiv-demo-store.myshopify.com/admin/api/2025-04/graphql.json`;
const SHOPIFY_ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_CREATE_COMPANY_ACCESS_TOKEN!;

// Helper to map full country names to ISO 2-letter codes
function getCountryCode(countryName: string): string {
  const countries: Record<string, string> = {
    India: 'IN',
    'United States': 'US',
    Canada: 'CA',
    Australia: 'AU',
    // Add more countries if needed
  };
  return countries[countryName] || countryName;
}

// Helper to map full state/province names to Shopify zone codes
function getZoneCode(provinceName: string): string {
  const provinces: Record<string, string> = {
    'South West': 'DL',
    Delhi: 'DL',
    Maharashtra: 'MH',
    Karnataka: 'KA',
    // Add more if needed
  };
  return provinces[provinceName] || provinceName;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      externalId,
      email,
      firstName,
      lastName,
      locationName,
      address1,
      city,
      province,
      zip,
      country,
    } = body;

    if (
      !name ||
      !externalId ||
      !email ||
      !firstName ||
      !lastName ||
      !locationName ||
      !address1 ||
      !city ||
      !province ||
      !zip ||
      !country
    ) {
      return NextResponse.json(
        { error: [{ message: 'Name, externalId, email, first name, last name, and address fields are required.' }] },
        { status: 400 }
      );
    }

    const query = `
      mutation CompanyCreate($input: CompanyCreateInput!) {
        companyCreate(input: $input) {
          company {
            id
            name
            externalId
            mainContact {
              id
              customer {
                id
                email
                firstName
                lastName
              }
            }
            contacts(first: 5) {
              edges {
                node {
                  id
                  customer {
                    email
                    firstName
                    lastName
                  }
                }
              }
            }
            contactRoles(first: 5) {
              edges {
                node {
                  id
                  name
                }
              }
            }
            locations(first: 5) {
              edges {
                node {
                  id
                  name
                  shippingAddress {
                    firstName
                    lastName
                    address1
                    city
                    province
                    zip
                    country
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
            code
          }
        }
      }
    `;

    const variables = {
      input: {
        company: {
          name,
          externalId,
        },
        companyContact: {
          email,
          firstName,
          lastName,
        },
        companyLocation: {
          name: locationName,
          shippingAddress: {
            firstName,
            lastName,
            address1,
            city,
            zoneCode: getZoneCode(province),
            zip,
            countryCode: getCountryCode(country),
          },
          billingSameAsShipping: true,
        },
      },
    };

    const response = await fetch(SHOPIFY_ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await response.json();
    console.log('Shopify Response:', JSON.stringify(json, null, 2));

    const userErrors = json.data?.companyCreate?.userErrors ?? [];
    if (json.errors || userErrors.length > 0) {
      return NextResponse.json(
        { error: json.errors || userErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: '✅ Company created successfully.',
      company: json.data.companyCreate.company,
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
