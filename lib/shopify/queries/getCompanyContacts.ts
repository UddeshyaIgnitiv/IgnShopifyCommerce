
// lib/shopify/queries/getCompanyContacts.ts
export const getCompanyContactsQuery = `
  query getCompanyContacts($companyId: ID!) {
    company(id: $companyId) {
      id
      name
      contacts(first: 50) {
        edges {
          node {
            id
            title
            isMainContact
            customer {
              id
              email
              firstName
              lastName
              metafield(namespace: "b2b", key: "role") {
                value
              }
            }
            roleAssignments(first: 5) {
              edges {
                node {
                  companyLocation {
                    id
                    name
                  }
                  role {
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const getCompanyContactRolesQuery = `
  query getCompanyContactRoles($companyId: ID!) {
  company(id: $companyId) {
    contactRoles(first: 10) {
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


