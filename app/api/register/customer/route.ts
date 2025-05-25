import {
  ASSIGN_ROLE_TO_CUSTOMER_MUTATION,
  COMPANY_ASSIGN_MAIN_CONTACT_MUTATION,
  COMPANY_CONTACT_CREATE_MUTATION,
  UPDATE_CUSTOMER_TAGS_MUTATION
} from 'lib/shopify/mutations/companyCreateMainContactAndAssign';
import { GET_COMPANY_QUERY } from 'lib/shopify/queries/getCompany';
import { shopifyFetch } from 'lib/shopify_service';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js/max';
import { NextResponse } from 'next/server';

function formatPhoneE164(rawPhone: string, countryCode: string): string | null {
  const cleaned = rawPhone.replace(/[\s\-().]/g, '');
  const parsed = parsePhoneNumberFromString(cleaned, countryCode.toUpperCase() as CountryCode);
  return parsed?.isValid() ? parsed.number : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      country,
      companyId,
      assignAsMainContact = true,
    } = body;
    const role = 'admin';

    // ✅ Step 1: Validate fields individually
    const errors: { field: string; message: string }[] = [];

    if (!email) errors.push({ field: 'email', message: 'Email is required.' });
    if (!firstName) errors.push({ field: 'firstName', message: 'First name is required.' });
    if (!lastName) errors.push({ field: 'lastName', message: 'Last name is required.' });
    if (!phone) errors.push({ field: 'phone', message: 'Phone number is required.' });
    if (!country) errors.push({ field: 'country', message: 'Country code is required.' });
    if (!companyId) errors.push({ field: 'companyId', message: 'Company ID is required.' });

    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    // ✅ Step 2: Format phone number
    const formattedPhone = formatPhoneE164(phone, country);
    if (!formattedPhone) {
      return NextResponse.json(
        {
          error: [{ field: 'phone', message: 'Invalid phone number format.' }],
        },
        { status: 400 }
      );
    }

    // ✅ Step 3: Get company
    const companyRes = await shopifyFetch(GET_COMPANY_QUERY, { id: companyId });
    const company = companyRes?.company;

    if (!company) {
      return NextResponse.json(
        {
          error: [{ field: 'companyId', message: 'Company not found.' }],
        },
        { status: 404 }
      );
    }

    const externalId = company.externalId || company.id;

    // ✅ Step 4: Create company contact
    const contactRes = await shopifyFetch(COMPANY_CONTACT_CREATE_MUTATION, {
      companyId,
      input: { email, firstName, lastName, phone: formattedPhone },
    });

    const contactErrors = contactRes?.companyContactCreate?.userErrors ?? [];
    if (contactErrors.length > 0) {
      const formattedErrors = contactErrors.map((e: any) => ({
        field: e.field?.[0] || 'unknown',
        message: e.message,
      }));
      return NextResponse.json({ error: formattedErrors }, { status: 400 });
    }

    const contact = contactRes?.companyContactCreate?.companyContact;
    const customer = contact?.customer;

    if (!contact?.id || !customer?.id) {
      return NextResponse.json(
        {
          error: [{ field: 'contact', message: 'Contact or customer data missing after creation.' }],
        },
        { status: 500 }
      );
    }

    // ✅ Step 5: Assign as main contact (if needed)
    if (assignAsMainContact) {
      const assignRes = await shopifyFetch(COMPANY_ASSIGN_MAIN_CONTACT_MUTATION, {
        companyContactId: contact.id,
        companyId,
      });

      const assignErrors = assignRes?.companyAssignMainContact?.userErrors ?? [];
      if (assignErrors.length > 0) {
        const formattedAssignErrors = assignErrors.map((e: any) => ({
          field: e.field?.[0] || 'assignAsMainContact',
          message: e.message,
        }));
        return NextResponse.json({ error: formattedAssignErrors }, { status: 400 });
      }
    }

    //console.log("contact?.customer?.id", contact?.customer?.id)

     // ✅ Step 6: Assign customer role (e.g., 'buyer')
    const roleRes = await shopifyFetch(ASSIGN_ROLE_TO_CUSTOMER_MUTATION, {
      customerId: contact?.customer?.id,
      role: JSON.stringify(role), // Pass role from request body, default to 'buyer'
    });

    const roleErrors = roleRes?.customerUpdate?.userErrors ?? [];
    if (roleErrors.length > 0) {
      return NextResponse.json({ error: roleErrors }, { status: 400 });
    }

    // ✅ Step 6: Add customer tag
    const tagRes = await shopifyFetch(UPDATE_CUSTOMER_TAGS_MUTATION, {
      input: {
        id: customer.id,
        tags: [`Company:${externalId}`],
      },
    });

    const tagErrors = tagRes?.customerUpdate?.userErrors ?? [];
    const globalErrors = tagRes?.errors ?? [];

    if (tagErrors.length > 0 || globalErrors.length > 0) {
      const formattedTagErrors = [...tagErrors, ...globalErrors].map((e: any) => ({
        field: 'tags',
        message: e.message,
      }));
      return NextResponse.json({ error: formattedTagErrors }, { status: 400 });
    }

    // ✅ Success
    return NextResponse.json({
      message: '✅ Company contact created and tagged successfully.',
      contact,
      customer,
      assignedAsMainContact: assignAsMainContact,
    });

  } catch (error: unknown) {
    console.error('Error in companyContactCreate handler:', error);
    return NextResponse.json(
      {
        error: [
          {
            field: 'server',
            message: error instanceof Error ? error.message : 'Unexpected server error.',
          },
        ],
      },
      { status: 500 }
    );
  }
}
