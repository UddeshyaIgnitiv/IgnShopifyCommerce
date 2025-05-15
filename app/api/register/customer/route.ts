import {
  COMPANY_ASSIGN_MAIN_CONTACT_MUTATION,
  COMPANY_CONTACT_CREATE_MUTATION,
  UPDATE_CUSTOMER_TAGS_MUTATION,
} from 'lib/shopify/mutations/companyCreateMainContactAndAssign';
import { GET_COMPANY_QUERY } from 'lib/shopify/queries/getCompany';
import { shopifyFetch } from 'lib/shopify_service';
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js/max'; // ✅ full metadata
import { NextResponse } from 'next/server';

function formatPhoneE164(rawPhone: string, countryCode: string): string | null {
  const cleaned = rawPhone.replace(/[\s\-().]/g, '');
  const parsed = parsePhoneNumberFromString(cleaned, countryCode.toUpperCase() as CountryCode);
  return parsed?.isValid() ? parsed.number : null; // E.164 format
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

    if (!email || !firstName || !lastName || !phone || !country || !companyId) {
      return NextResponse.json(
        {
          error: 'Fields email, firstName, lastName, phone, country and companyId are required.',
        },
        { status: 400 }
      );
    }

    // ✅ Format phone number server-side
    const formattedPhone = formatPhoneE164(phone, country);

    console.log("formattedPhone", formattedPhone);
    if (!formattedPhone) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format. Please use a valid number like 9958157784 for India.',
        },
        { status: 400 }
      );
    }

    const companyRes = await shopifyFetch(GET_COMPANY_QUERY, { id: companyId });
    const company = companyRes?.company;

    if (!company) {
      return NextResponse.json({ error: 'Company not found.' }, { status: 404 });
    }

    const externalId = company.externalId || company.id;

    const contactRes = await shopifyFetch(COMPANY_CONTACT_CREATE_MUTATION, {
      companyId,
      input: { email, firstName, lastName, phone: formattedPhone },
    });

    const contactErrors = contactRes?.companyContactCreate?.userErrors;
    if (contactErrors?.length > 0) {
      return NextResponse.json(
        {
          error: 'Company contact creation failed.',
          details: contactErrors,
        },
        { status: 400 }
      );
    }

    const contact = contactRes?.companyContactCreate?.companyContact;
    const customer = contact?.customer;

    if (!contact?.id || !customer?.id) {
      return NextResponse.json(
        { error: 'Company contact or customer not returned.' },
        { status: 500 }
      );
    }

    if (assignAsMainContact) {
      const assignRes = await shopifyFetch(COMPANY_ASSIGN_MAIN_CONTACT_MUTATION, {
        companyContactId: contact.id,
        companyId,
      });

      const assignErrors = assignRes?.companyAssignMainContact?.userErrors;
      if (assignErrors?.length > 0) {
        return NextResponse.json(
          {
            error: 'Failed to assign main contact.',
            details: assignErrors,
          },
          { status: 400 }
        );
      }
    }

    const tagRes = await shopifyFetch(UPDATE_CUSTOMER_TAGS_MUTATION, {
      input: {
        id: customer.id,
        tags: [`Company:${externalId}`],
      },
    });

    const tagErrors = tagRes?.customerUpdate?.userErrors;
    if ((tagRes.errors && tagRes.errors.length > 0) || (tagErrors?.length > 0)) {
      return NextResponse.json(
        {
          error: 'Tagging customer failed.',
          details: tagRes.errors || tagErrors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: '✅ Company contact created and tagged successfully.',
      contact,
      customer,
      assignedAsMainContact: assignAsMainContact,
      userErrors: [],
    });

  } catch (error: unknown) {
    console.error('Error in companyContactCreate handler:', error);
    return NextResponse.json(
      {
        userErrors: [
          {
            message:
              error instanceof Error ? error.message : 'Unexpected error occurred.',
          },
        ],
      },
      { status: 500 }
    );
  }
}
