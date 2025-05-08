// /graphql/company.ts
export const COMPANY_CREATE_MUTATION = `
mutation CompanyCreate($input: CompanyCreateInput!) {
  companyCreate(input: $input) {
    company {
      id
      name
      externalId
      locations(first: 5) {
        edges {
          node {
            id
            name
            shippingAddress {
              address1
              city
              province
              zip
              country
            }
          }
        }
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