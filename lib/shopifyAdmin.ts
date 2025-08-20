// lib/shopifyAdmin.ts
// import fetch from 'node-fetch';
import { getCompanyContactRolesQuery, getCompanyContactsQuery } from './shopify/queries/getCompanyContacts';
const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN!;
const SHOPIFY_ADMIN_API_ACCESS_TOKEN = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!;
const API_VER = process.env.SHOPIFY_API_VERSION || '2025-04';

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ADMIN_API_ACCESS_TOKEN) {
  throw new Error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_ACCESS_TOKEN');
}

export async function adminFetch(path: string, opts: { method?: string; body?: any } = {}) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VER}/${path}`;
  try {
    const res = await fetch(url, {
      method: opts.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`Shopify Admin API ${res.status}: ${text}`);
    }

    return text ? JSON.parse(text) : {};
  } catch (error: any) {
    console.error(`adminFetch error: ${error.message || error}`);
    throw new Error(`adminFetch failed: ${error.message || 'Unknown error'}`);
  }
}

export async function adminGraphql(query: string, variables: Record<string, any> = {}) {
  const url = `https://${SHOPIFY_STORE_DOMAIN}/admin/api/${API_VER}/graphql.json`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_ADMIN_API_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = await res.json();

    if (json.errors) {
      throw new Error(JSON.stringify(json.errors));
    }
    //console.log('[adminGraphql] query done');
    return json.data;
  } catch (error: any) {
    console.error(`adminGraphql error: ${error.message || error}`);
    throw new Error(`adminGraphql failed: ${error.message || 'Unknown error'}`);
  }
}


// export async function getCompanyContacts(companyId: string) {
//   const response = await adminGraphql(getCompanyContactsQuery, {
//     companyId,
//   });

//   const edges = response?.company?.contacts?.edges || [];

//   return edges
//     .map((edge: any) => edge.node?.customer)
//     .filter(Boolean)
//     .map((customer: any) => ({
//       id: customer.id,
//       email: customer.email,
//       firstName: customer.firstName,
//       lastName: customer.lastName,
//     }));
// }

export async function getCompanyContacts(companyId: string) {
  const response = await adminGraphql(getCompanyContactsQuery, { companyId });
  const contacts = response?.company?.contacts?.edges || [];

  return contacts
    .map((edge: any) => {
      const contact = edge.node;
      const customer = contact.customer;
      if (!customer) return null;

      // Extract roles & locations
      const rolesAndLocations = (contact.roleAssignments?.edges || []).map((ra: any) => {
        const node = ra.node;
        return {
          location: node.companyLocation?.name || 'Unknown location',
          address: node.companyLocation?.address?.address1 || '',
          role: node.role?.name || 'Unknown role',
        };
      });

      // ✅ Get b2b.role metafield and determine isAdmin
      const rawB2bValue = customer?.metafield?.value || '';
      const b2bValue = rawB2bValue.replace(/^"+|"+$/g, '');
      const isB2bAdminRole = b2bValue === 'admin';

      return {
        id: customer.id,
        contactId: contact.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        permissions: rolesAndLocations,
        isMainContact: contact.isMainContact,
        isB2bAdminRole,
        b2bRole: b2bValue || '',
      };
    })
    .filter(Boolean);
}

export async function getCompanyContactRoles(companyId: string) {
  const response = await adminGraphql(getCompanyContactRolesQuery, {companyId});
  return (
    response?.company?.contactRoles?.edges?.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
    })) || []
  );
}
