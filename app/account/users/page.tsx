import UserAccountsManager from 'components/UserAccountsManager';
import { adminGraphql } from 'lib/shopifyAdmin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const GET_ME = /* GraphQL */ `
  query getCustomerByEmail($q: String!) {
    customers(first: 1, query: $q) {
      edges {
        node {
          id
          email
          metafield(namespace: "custom", key: "is_customer_admin") { value }
        }
      }
    }
  }
`;

export default async function UserPage() {
  const email = (await cookies()).get('user_email')?.value || '';
  if (!email) redirect('/account/login');

  const data = await adminGraphql(GET_ME, { q: `email:${email}` });
  const customer = data?.customers?.edges?.[0]?.node || null;
  if (!customer) redirect('/account/login');

  const isAdmin = String(customer?.metafield?.value || '').trim().toLowerCase() === 'true';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto bg-yellow-50 border border-yellow-200 p-6 rounded">
          <h1 className="text-xl font-semibold mb-2">Access denied</h1>
          <p>You must be an admin customer to manage Users</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-start justify-center p-8">
      {/* No event handlers passed from server → client is safe */}
      <UserAccountsManager isAdmin={isAdmin} />
    </main>
  );
}
