export const GET_ORDER = /* GraphQL */ `
  query getOrder($id: ID!) {
    order(id: $id) {
      id
      name
      poNumber
      createdAt
      currencyCode
      email
      phone

      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalTaxSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }

      billingAddress {
        name
        company
        address1
        address2
        city
        province
        country
        zip
        phone
      }

      shippingAddress {
        name
        company
        address1
        address2
        city
        province
        country
        zip
        phone
      }

      discountApplications(first: 10) {
        edges {
          node {
            __typename
            ... on DiscountCodeApplication {
              code
              value {
                __typename
                ... on MoneyV2 {
                  amount
                  currencyCode
                }
                ... on PricingPercentageValue {
                  percentage
                }
              }
            }
          }
        }
      }

      lineItems(first: 50) {
        edges {
          node {
            title
            quantity
            currentQuantity
            sku
            discountedTotalSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            originalTotalSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            discountAllocations {
              allocatedAmount {
                amount
                currencyCode
              }
            }
            variant {
              sku
              title
              price
            }
          }
        }
      }

      transactions {
        id
        gateway
        status
        kind
        processedAt
        amountSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;
