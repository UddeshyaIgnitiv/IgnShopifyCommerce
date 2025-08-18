import { adminGraphql, getCompanyContactRoles, getCompanyContacts } from 'lib/shopifyAdmin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const email = (await cookies()).get('user_email')?.value;
    console.log("email", email);
    if (!email) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Step 1: Get the customer and their associated company via companyContactProfiles
    const GET_CUSTOMER_COMPANY = `
      query getCustomerCompany($q: String!) {
        customers(first: 1, query: $q) {
          edges {
            node {
              id
              companyContactProfiles {
                company {
                  id
                }
              }
            }
          }
        }
      }
    `;

    const res = await adminGraphql(GET_CUSTOMER_COMPANY, { q: `email:${email}` });
    const customerNode = res?.customers?.edges?.[0]?.node;
    const companyProfile = customerNode?.companyContactProfiles?.[0]?.company;
    const companyId = companyProfile?.id;

    // console.log("res", res);
    // console.log("customerNode", customerNode);
    // console.log("companyProfile", companyProfile);
    // console.log("companyId", companyId);

    if (!companyId) {
      return NextResponse.json({ error: 'No company associated', status: 404 });
    }

    // Step 2: Fetch all contacts using companyId
    const user = await getCompanyContacts(companyId);
    console.log("user", user);

    // ✅ Step 3: Fetch available company contact roles
    const roles = await getCompanyContactRoles(companyId);
    //console.log("roles", roles);

    // Step 4: Fetch company locations
    const GET_COMPANY_LOCATIONS = `
      query getCompanyLocations($id: ID!) {
        company(id: $id) {
          locations(first: 25) {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `;

    const locRes = await adminGraphql(GET_COMPANY_LOCATIONS, { id: companyId });
    const locationEdges = locRes?.company?.locations?.edges || [];

    const locations = locationEdges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
    }));

    return NextResponse.json({ companyId, users: user, roles, locations, currentUserEmail: email,  }); // <- include roles
  } catch (e: any) {
    console.error('[GET /api/users] error:', e?.message || e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = (await cookies()).get('user_email')?.value;
    if (!email) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const {
      email: newUserEmail,
      firstName,
      lastName,
      role,
      location,
      locationName,
    } = body;

    // Step 1: Get companyId for current admin
    const GET_CUSTOMER_COMPANY = `query getCustomerCompany($q: String!) {
      customers(first: 1, query: $q) {
        edges {
          node {
            companyContactProfiles {
              company { id }
            }
          }
        }
      }
    }`;

    const res = await adminGraphql(GET_CUSTOMER_COMPANY, { q: `email:${email}` });
    const companyId = res?.customers?.edges?.[0]?.node?.companyContactProfiles?.[0]?.company?.id;

    if (!companyId) {
      return NextResponse.json({ error: 'No company found for admin.' }, { status: 404 });
    }

    // Step 2: Optionally create new location if locationName provided
    let locationId: string | undefined;

    if (locationName) {
      const CREATE_LOCATION = `mutation companyLocationCreate($input: CompanyLocationCreateInput!) {
        companyLocationCreate(input: $input) {
          companyLocation {
            id
            name
          }
          userErrors {
            field
            message
          }
        }
      }`;

      const locationPayload = {
        input: {
          companyId,
          name: locationName,
        },
      };

      const locRes = await adminGraphql(CREATE_LOCATION, locationPayload);
      const userErrors = locRes?.companyLocationCreate?.userErrors;
      if (userErrors?.length) {
        return NextResponse.json({ error: userErrors[0]?.message || 'Failed to create location' }, { status: 400 });
      }

      locationId = locRes?.companyLocationCreate?.companyLocation?.id;
      console.log("locationId", locationId);
    } else {
      // // If existing location selected, look up its ID
      // const LOCATIONS_QUERY = `query getCompanyLocations($id: ID!) {
      //   company(id: $id) {
      //     locations(first: 25) {
      //       edges {
      //         node {
      //           id
      //           name
      //         }
      //       }
      //     }
      //   }
      // }`;

      // const locRes = await adminGraphql(LOCATIONS_QUERY, { id: companyId });
      // console.log("locRes", locRes?.company?.locations?.edges);
      // const matched = locRes?.company?.locations?.edges?.find(
      //   (edge: any) => {
      //   console.log("Checking edge.node.id:", edge?.node?.id);
      //   return edge?.node?.name === location;
      // });
      // console.log("Matched", matched);
      // if (!matched) {
      //   return NextResponse.json({ error: 'Selected location not found' }, { status: 404 });
      // }
      locationId = location;
    }

    if (!locationId) {
      return NextResponse.json({ error: 'No valid location ID found or created' }, { status: 400 });
    }

    // Step 3: Create the contact
    const CREATE_CONTACT = `
      mutation companyContactCreate($companyId: ID! $input: CompanyContactInput!) {
        companyContactCreate(companyId: $companyId, input: $input) {
          companyContact {
            id
            customer {
              id
              firstName
              lastName
              email
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

    const contactPayload = {
      companyId,
      input: {
        email: newUserEmail,
        firstName,
        lastName,
      },
    };


    const contactRes = await adminGraphql(CREATE_CONTACT, contactPayload);
    const contactErrors = contactRes?.companyContactCreate?.userErrors;

    if (contactErrors?.length) {
      return NextResponse.json({ error: contactErrors[0]?.message || 'Failed to create user' }, { status: 400 });
    }

     // Extract contactId from the response here:
    const contactId = contactRes?.companyContactCreate?.companyContact?.id;

    if (!contactId) {
      return NextResponse.json({ error: 'Failed to retrieve created contact ID' }, { status: 500 });
    }

    const ASSIGN_ROLE = `
      mutation companyContactAssignRole(
        $companyContactId: ID!, 
        $companyLocationId: ID!, 
        $companyContactRoleId: ID!
      ) {
        companyContactAssignRole(
          companyContactId: $companyContactId, 
          companyLocationId: $companyLocationId, 
          companyContactRoleId: $companyContactRoleId
        ) {
          userErrors { field message }
        }
      }
    `;

    const assignPayload = {
      companyContactId: contactId,
      companyLocationId: locationId,
      companyContactRoleId: role,
    };

    const assignRes = await adminGraphql(ASSIGN_ROLE, assignPayload);
    if (assignRes?.companyContactAssignRole?.userErrors?.length) {
      return NextResponse.json({ error: assignRes.companyContactAssignRole.userErrors[0].message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[POST /api/users] error:', e?.message || e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { contactId } = await req.json(); // companyContact.id
    const email = (await cookies()).get('user_email')?.value;

    if (!contactId || !email) {
      return NextResponse.json({ error: 'Missing id or not logged in' }, { status: 400 });
    }

    // Get current user's company and contact ID
    const GET_CUSTOMER_COMPANY = `query getCustomerCompany($q: String!) {
      customers(first: 1, query: $q) {
        edges {
          node {
            id
            email
            companyContactProfiles {
              id
              company { id }
            }
          }
        }
      }
    }`;
    const res = await adminGraphql(GET_CUSTOMER_COMPANY, { q: `email:${email}` });
    const currentCustomer = res?.customers?.edges?.[0]?.node;
    //const companyId = currentCustomer?.companyContactProfiles?.[0]?.company?.id;
    const currentContactId = currentCustomer?.companyContactProfiles?.[0]?.id;
    const isAdmin = String(currentCustomer?.metafield?.value || '').toLowerCase() === 'true';

    //const isAdmin = String(customer?.metafields?.find(mf => mf.namespace === "custom" && mf.key === "is_customer_admin")?.value || '').toLowerCase() === 'true';
    // if (!companyId) {
    //   return NextResponse.json({ error: 'No company found for admin.' }, { status: 404 });
    // }

    // 🚫 Prevent admin from deleting their own account
    if (contactId === currentContactId) {
      return NextResponse.json(
        { error: 'Admins cannot delete their own account.' },
        { status: 403 }
      );
    }

    // 🔍 Step 1: Fetch this contact to check who it belongs to
    const GET_CONTACT = `
      query getContact($id: ID!) {
        companyContact(id: $id) {
          id
          isMainContact
          customer {
            id 
            email 
            metafield(namespace: "custom", key: "isAdmin") { value }
          }
        }
      }
    `;
    const contactRes = await adminGraphql(GET_CONTACT, { id: contactId });
    const contact = contactRes?.companyContact;

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const targetIsAdmin = String(contact?.customer?.metafield?.value || '').toLowerCase() === 'true';

    // 🚫 Step 2: Prevent deleting self or main contact
    if (contact.customer?.email === email || contactId === currentContactId) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 403 });
    }
    
    if (contact.isMainContact) {
      return NextResponse.json({ error: 'Cannot delete the main company contact' }, { status: 403 });
    }

    // Delete contact
    const DELETE_CONTACT = `
      mutation companyContactDelete($companyContactId: ID!) {
        companyContactDelete(companyContactId: $companyContactId) {
          deletedCompanyContactId
          userErrors { field message }
        }
      }
    `;
    const deleteRes = await adminGraphql(DELETE_CONTACT, { companyContactId: contactId });

    if (deleteRes?.companyContactDelete?.userErrors?.length) {
      return NextResponse.json({ error: deleteRes.companyContactDelete.userErrors[0].message }, { status: 400 });
    }

    // ✅ Step 4: Delete corresponding Customer record from Admin
    if (contact.customer?.id) {
      const DELETE_CUSTOMER = `
        mutation customerDelete($input: CustomerDeleteInput!) {
          customerDelete(input: $input) {
            deletedCustomerId
            userErrors { field message }
          }
        }
      `;

      const deleteCustRes = await adminGraphql(DELETE_CUSTOMER, { input: { id: contact.customer.id } });

      if (deleteCustRes?.customerDelete?.userErrors?.length) {
        console.error("Customer delete error:", deleteCustRes.customerDelete.userErrors);
        return NextResponse.json({ error: deleteCustRes.customerDelete.userErrors[0].message }, { status: 400 });
      }
    }


    return NextResponse.json({ 
      success: true, 
      deletedId: deleteRes?.companyContactDelete?.deletedCompanyContactId,
      deletedCustomerId: contact.customer?.id || null
     });
  } catch (e: any) {
    console.error('[DELETE /api/users] error:', e?.message || e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

