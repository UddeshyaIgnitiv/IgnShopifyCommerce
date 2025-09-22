import { adminGraphql, getCompanyContactRoles, getCompanyContacts } from 'lib/shopifyAdmin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Helper: Maps UI roles to Shopify Admin role names, then finds their ID from fetched roles
function mapUIRoleToShopifyRoleId(uiRole: string, shopifyRoles: any[]): string | null {
  const roleMap: Record<string, string> = {
    admin: 'Location admin',
    purchaser: 'Ordering only',
    non_purchaser: 'Ordering only',
  };
  const targetShopifyRoleName = roleMap[uiRole];
  console.log('Mapped Shopify Role Name:', targetShopifyRoleName);
  return shopifyRoles.find(
    (r) => r.name?.toLowerCase() === targetShopifyRoleName?.toLowerCase()
  )?.id || null;
}


export async function GET() {
  try {
    const email = (await cookies()).get('user_email')?.value;
    //console.log("email", email);
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
    const customerId = customerNode?.id;

    //console.log("res", res);
    //console.log("customerNode", customerNode);
    //console.log("companyProfile", companyProfile);
    //console.log("companyId", companyId);
    //console.log("customerId", customerId);

    if (!companyId || !customerId) {
      return NextResponse.json({ error: 'Missing company or customer data' }, { status: 404 });
    }

    // Step 2: Fetch all contacts using companyId
    const user = await getCompanyContacts(companyId);
    //console.log("user", user);

    // Step 3: Fetch available company contact roles
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
    })) || [];

    // 👇 Fetch the b2b.role metafield
    const GET_CUSTOMER_ROLE_METAFIELD = `
      query getCustomerRoleMetafield($id: ID!) {
        customer(id: $id) {
          metafield(namespace: "b2b", key: "role") {
            value
          }
        }
      }
    `;

    const roleRes = await adminGraphql(GET_CUSTOMER_ROLE_METAFIELD, { id: customerId });
    const b2bRole = roleRes?.customer?.metafield?.value || 'purchaser';

    return NextResponse.json({ companyId, users: user, roles, locations, currentUserEmail: email, role: b2bRole,  }); // <- include roles
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
      //console.log("locationId", locationId);
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

    // Step 3: Fetch roles so we can map ui role → Shopify role ID
    const roles = await getCompanyContactRoles(companyId);
    const shopifyRoleId = mapUIRoleToShopifyRoleId(role, roles);

    //console.log("Roles", roles, "shopifyRoleId", shopifyRoleId);

    if (!shopifyRoleId) {
      return NextResponse.json({ error: 'Shopify role mapping failed' }, { status: 400 });
    }

    // Step 4: Create the contact
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

    // Extract contactId & customerId
    const contactId = contactRes?.companyContactCreate?.companyContact?.id;
    const customerId = contactRes?.companyContactCreate?.companyContact?.customer?.id;

    if (!contactId || !customerId) {
      return NextResponse.json({ error: 'Failed to retrieve created contact or customer ID' }, { status: 500 });
    }

    // --- UPDATE b2b.role metafield on customer ---
    const UPDATE_B2B_ROLE = `
      mutation updateB2BRoleMetafield($customerId: ID!, $value: String!) {
        customerUpdate(input: {
          id: $customerId,
          metafields: [{
            namespace: "b2b",
            key: "role",
            type: "json",
            value: $value
          }]
        }) {
          userErrors { field message }
        }
      }
    `;

    const b2bRoleRes = await adminGraphql(UPDATE_B2B_ROLE, {
      customerId,
      value: JSON.stringify(role), // admin | purchaser | non-purchaser
    });

    if (b2bRoleRes?.customerUpdate?.userErrors?.length) {
      return NextResponse.json({ error: b2bRoleRes.customerUpdate.userErrors[0].message }, { status: 400 });
    }

    // Step 5: Assign Shopify Admin role to the contact
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
      companyContactRoleId: shopifyRoleId,
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
    const GET_CUSTOMER_COMPANY = `
      query getCustomerCompany($q: String!) {
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
      }
    `;
    const res = await adminGraphql(GET_CUSTOMER_COMPANY, { q: `email:${email}` });
    const currentCustomer = res?.customers?.edges?.[0]?.node;
    const currentContactId = currentCustomer?.companyContactProfiles?.[0]?.id;

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

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { contactId, firstName, lastName, role, location } = body;

    console.log('PUT /api/users called with:', { contactId, firstName, lastName, role, location });

    // Basic validation
    if (!contactId || !role || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const allowedRoles = ['admin', 'purchaser', 'non_purchaser'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role provided' }, { status: 400 });
    }

    const userEmail = (await cookies()).get('user_email')?.value;
    if (!userEmail) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    // Step 1: Get company ID for logged-in user
    const GET_CUSTOMER_COMPANY = `
      query getCustomerCompany($q: String!) {
        customers(first: 1, query: $q) {
          edges {
            node {
              companyContactProfiles {
                company { id }
                customer { id }
              }
            }
          }
        }
      }
    `;

    const companyRes = await adminGraphql(GET_CUSTOMER_COMPANY, { q: `email:${userEmail}` });

    const companyId = companyRes?.customers?.edges?.[0]?.node?.companyContactProfiles?.[0]?.company?.id;
    const customerId = companyRes?.customers?.edges?.[0]?.node?.companyContactProfiles?.[0]?.customer?.id;

    if (!companyId || !customerId) {
      return NextResponse.json({ error: 'No company or customer found for user' }, { status: 404 });
    }

    // Step 2: Map UI role to Shopify role ID
    const roleList = await getCompanyContactRoles(companyId);
    const shopifyRoleId = mapUIRoleToShopifyRoleId(role, roleList);
    if (!shopifyRoleId) {
      return NextResponse.json({ error: 'Invalid role mapping' }, { status: 400 });
    }

    // Step 3: Query existing role assignment for this contact at that location
    const GET_EXISTING_ASSIGNMENT = `
      query getExistingAssignment($companyLocationId: ID!) {
        companyLocation(id: $companyLocationId) {
          roleAssignments(first: 50) {
            edges {
              node {
                id
                companyContact { id }
                role { id name }
              }
            }
          }
        }
      }
    `;

    const existingRes = await adminGraphql(GET_EXISTING_ASSIGNMENT, { companyLocationId: location });

    if (!existingRes?.companyLocation) {
      return NextResponse.json({ error: 'Invalid location ID' }, { status: 400 });
    }

    const assignments = existingRes.companyLocation.roleAssignments.edges || [];
    const existingNode = assignments.find((e: any) => e?.node?.companyContact?.id === contactId);

    let existingAssignmentId: string | null = null;
    let existingRoleId: string | null = null;

    if (existingNode) {
      existingAssignmentId = existingNode.node.id;
      existingRoleId = existingNode.node.role.id;
    }

    // Step 4: Revoke and reassign role if needed
    if (existingRoleId === shopifyRoleId) {
      console.log('Role already assigned. No changes needed.');
    } else {
      // Revoke old role
      if (existingAssignmentId) {
        const REVOKE_ROLE = `
          mutation companyContactRevokeRole($companyContactId: ID!, $companyContactRoleAssignmentId: ID!) {
            companyContactRevokeRole(
              companyContactId: $companyContactId,
              companyContactRoleAssignmentId: $companyContactRoleAssignmentId
            ) {
              revokedCompanyContactRoleAssignmentId
              userErrors {
                field
                message
              }
            }
          }
        `;

        const revokeRes = await adminGraphql(REVOKE_ROLE, {
          companyContactId: contactId,
          companyContactRoleAssignmentId: existingAssignmentId,
        });

        const revokeErrors = revokeRes?.companyContactRevokeRole?.userErrors || [];
        if (revokeErrors.length > 0) {
          return NextResponse.json({ error: revokeErrors[0].message }, { status: 400 });
        }

        console.log('Revoked old role assignment:', existingAssignmentId);
      }

      // Assign new role
      const ASSIGN_ROLE = `
        mutation companyContactAssignRole($companyContactId: ID!, $companyContactRoleId: ID!, $companyLocationId: ID!) {
          companyContactAssignRole(
            companyContactId: $companyContactId,
            companyContactRoleId: $companyContactRoleId,
            companyLocationId: $companyLocationId
          ) {
            companyContactRoleAssignment {
              id
              role { id name }
            }
            userErrors { field message }
          }
        }
      `;

      const assignRes = await adminGraphql(ASSIGN_ROLE, {
        companyContactId: contactId,
        companyContactRoleId: shopifyRoleId,
        companyLocationId: location,
      });

      const assignErrors = assignRes?.companyContactAssignRole?.userErrors || [];
      if (assignErrors.length > 0) {
        return NextResponse.json({ error: assignErrors[0].message }, { status: 400 });
      }

      console.log('Assigned new role:', shopifyRoleId);
    }

    // Step 5: Update name (optional)
    if (firstName || lastName) {
      const UPDATE_NAME = `
        mutation updateCustomerName($id: ID!, $firstName: String, $lastName: String) {
          customerUpdate(input: {
            id: $id,
            firstName: $firstName,
            lastName: $lastName
          }) {
            customer { id }
            userErrors { field message }
          }
        }
      `;

      const nameRes = await adminGraphql(UPDATE_NAME, {
        id: customerId,  // Use the correct customer ID here
        firstName,
        lastName,
      });

      const nameErrors = nameRes?.customerUpdate?.userErrors || [];
      if (nameErrors.length > 0) {
        return NextResponse.json({ error: nameErrors[0].message }, { status: 400 });
      }

      console.log('Updated name:', { firstName, lastName });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in PUT /api/users:', err?.message || err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}



