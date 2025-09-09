export const getCustomerByEmailQuery = `
  query getCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      edges {
        node {
          id
          email
          displayName
          numberOfOrders
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
          
          # ✅ Add metafields for custom namespace
          metafields(first: 10, namespace: "custom") {
            edges {
              node {
                namespace
                key
                value
              }
            }
          }

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
              id
              name
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
              metafields(first: 10, namespace: "custom") {
                edges {
                  node {
                    namespace
                    key
                    value
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
