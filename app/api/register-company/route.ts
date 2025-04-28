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
      phone,
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
      !phone ||
      !locationName ||
      !address1 ||
      !city ||
      !province ||
      !zip ||
      !country
    ) {
      return NextResponse.json(
        { error: [{ message: 'Name, externalId, email, first name, last name, phone, and address fields are required.' }] },
        { status: 400 }
      );
    }

    // First Mutation: Create Company and Customer
    const companyCreateQuery = `
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
                phone  
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
                    phone  
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
    
    const companyCreateVariables = {
      input: {
        company: {
          name,
          externalId,
        },
        companyContact: {
          email,
          firstName,
          lastName,
          phone  
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

    const companyResponse = await fetch(SHOPIFY_ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({ query: companyCreateQuery, variables: companyCreateVariables }),
    });

    const companyJson = await companyResponse.json();
    console.log('Company Create Response:', JSON.stringify(companyJson, null, 2));

    const userErrors = companyJson.data?.companyCreate?.userErrors ?? [];
    if (companyJson.errors || userErrors.length > 0) {
      return NextResponse.json(
        { error: companyJson.errors || userErrors },
        { status: 400 }
      );
    }

    const customerId = companyJson.data.companyCreate.company.mainContact.customer.id;
    console.log("customerId", customerId);

    if (!customerId) {
      return NextResponse.json(
        { error: [{ message: 'Customer creation failed, no customerId found.' }] },
        { status: 400 }
      );
    }

    // Second Mutation: Send Account Invite Email
    const inviteEmailQuery = `
      mutation customerSendAccountInviteEmail($customerId: ID!) {
        customerSendAccountInviteEmail(customerId: $customerId) {
          customer {
            id
            email
          }
          userErrors {
            field
            message
          }
        }
      }
    `;
    
    const inviteEmailVariables = {
      customerId: customerId,
    };

    const inviteEmailResponse = await fetch(SHOPIFY_ADMIN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
      },
      body: JSON.stringify({ query: inviteEmailQuery, variables: inviteEmailVariables }),
    });

    const inviteEmailJson = await inviteEmailResponse.json();
    console.log('Invite Email Response:', JSON.stringify(inviteEmailJson, null, 2));

    const inviteUserErrors = inviteEmailJson.data?.customerSendAccountInviteEmail?.userErrors ?? [];
    if (inviteEmailJson.errors || inviteUserErrors.length > 0) {
      console.log('Invite Email Errors:', inviteEmailJson.errors);
      console.log('Invite Email User Errors:', inviteUserErrors);
      return NextResponse.json(
        { error: inviteEmailJson.errors || inviteUserErrors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: '✅ Company and customer created successfully, and invite email sent!',
      company: companyJson.data.companyCreate.company,
      inviteEmail: inviteEmailJson.data.customerSendAccountInviteEmail.customer,
    });

  } catch (error: unknown) {
    console.error('Error creating company or sending invite:', error);
    return NextResponse.json(
      {
        error: [{ message: error instanceof Error ? error.message : 'Unexpected error' }], 
      },
      { status: 500 }
    );
  }
}
