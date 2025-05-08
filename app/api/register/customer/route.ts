import {
  CREATE_CUSTOMER_MUTATION,
  UPDATE_CUSTOMER_TAGS_MUTATION
} from 'lib/shopify/mutations/customerCreate';
import { shopifyFetch } from 'lib/shopify_service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Step 1: Parse request body
    const body = await req.json();
    const { email, firstName, lastName, phone, companyId } = body;

    // Log input to debug (optional)
    //console.log("Received customer data:", { email, firstName, lastName, phone, companyId });

    // Step 2: Validate required fields
    if (!email || !firstName || !lastName || !phone || !companyId) {
      return NextResponse.json(
        { error: 'All fields (email, firstName, lastName, phone, companyId) are required.' },
        { status: 400 }
      );
    }

    // Step 3: Create Customer
    const customerInput = {
      input: { email, firstName, lastName, phone },
    };
    const customerRes = await shopifyFetch(CREATE_CUSTOMER_MUTATION, customerInput);

    // Log the response for debugging
    //console.log("customerRes", customerRes);

    // Check if userErrors are present
    const userErrors = customerRes?.customerCreate?.userErrors;

    if (userErrors && userErrors.length > 0) {
      const errorMessages = userErrors.map((error: { message: any; }) => error.message).join(', ');
      return NextResponse.json(
        { error: `Customer creation failed: ${errorMessages}` },
        { status: 400 }
      );
    }

    // Handle successful customer creation
    const customer = customerRes?.customerCreate?.customer;
    if (!customer || !customer.id) {
      return NextResponse.json(
        { error: 'Customer creation failed. No customer returned.' },
        { status: 400 }
      );
    }

    // Step 4: (Optional) Tagging Customer or Other Actions
    // If you plan to tag the customer, you can do it here. Example:
    const variables = {
  input: {
    id: customer.id,
    tags: [`Company:${companyId}`],
  },
};

const tagRes = await shopifyFetch(UPDATE_CUSTOMER_TAGS_MUTATION, variables);

const tagUserErrors  = tagRes?.data?.customerUpdate?.userErrors;

if ((tagRes.errors && tagRes.errors.length > 0) || (tagUserErrors  && tagUserErrors .length > 0)) {
  return NextResponse.json(
    {
      error: 'Tagging failed',
      details: tagRes.errors || tagUserErrors ,
    },
    { status: 400 }
  );
}


    // Step 5: Return Success Response
    return NextResponse.json({
      message: '✅ Customer created successfully.',
      customer,
    });

  } catch (error: unknown) {
    // Step 6: Handle unexpected errors
    console.error('Error in createCustomerWithTags:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error occurred.',
      },
      { status: 500 }
    );
  }
}
