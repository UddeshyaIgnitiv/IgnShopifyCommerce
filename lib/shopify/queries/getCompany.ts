export const GET_COMPANY_QUERY = `
  query getCompany($id: ID!) {
    company(id: $id) {
      externalId
    }
  }
`;