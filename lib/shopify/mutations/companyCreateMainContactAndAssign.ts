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