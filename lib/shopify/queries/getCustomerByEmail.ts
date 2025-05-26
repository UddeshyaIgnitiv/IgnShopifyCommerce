export const getCustomerByEmailQuery = `
  query getCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          displayName
          numberOfOrders
          orders(first: 10) {
            edges {
              node {
                confirmed
                confirmationNumber
                displayAddress {
                  formatted
                  name
                }
              }
            }
          }
          companyContactProfiles {
            title
            id
            isMainContact
            company {
              locations(first: 10) {
                edges {
                  node {
                    id
                    name
                    catalogsCount { count }
                    catalogs(first: 10) {
                      edges {
                        node {
                          title
                          priceList { name }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          id
          email
          firstName
          lastName
          phone
          note
          verifiedEmail
          validEmailAddress
          tags
          createdAt
          updatedAt
          amountSpent { amount currencyCode }
          defaultAddress {
            address1 address2 city province zip country formattedArea
          }
          addresses {
            address1 address2 city province zip country
          }
          image { src }
          canDelete
        }
      }
    }
  }
`;
