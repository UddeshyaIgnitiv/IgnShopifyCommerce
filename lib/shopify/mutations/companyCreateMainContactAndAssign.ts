// Mutation to create a company contact
export const COMPANY_CONTACT_CREATE_MUTATION = `
  mutation CompanyContactCreate($companyId: ID!, $input: CompanyContactInput!) {
    companyContactCreate(companyId: $companyId, input: $input) {
      companyContact {
        id
        customer {
          id
          email
          firstName
          lastName
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

// Mutation to assign the main contact to a company
export const COMPANY_ASSIGN_MAIN_CONTACT_MUTATION = `
  mutation CompanyAssignMainContact($companyContactId: ID!, $companyId: ID!) {
    companyAssignMainContact(companyContactId: $companyContactId, companyId: $companyId) {
      company {
        id
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Mutation to assign a role to the customer
export const ASSIGN_ROLE_TO_CUSTOMER_MUTATION = `
  mutation AssignRoleToCustomer($customerId: ID!, $role: String!) {
    customerUpdate(input: {
      id: $customerId,
      metafields: [
        {
          namespace: "b2b",
          key: "role",
          type: "json",
          value: $role
        }
      ]
    }) {
      customer {
        id
        metafields(first: 1, namespace: "b2b") {
          edges {
            node {
              key
              value
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;



// Mutation to update customer tags
export const UPDATE_CUSTOMER_TAGS_MUTATION = `
  mutation UpdateCustomerTags($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;