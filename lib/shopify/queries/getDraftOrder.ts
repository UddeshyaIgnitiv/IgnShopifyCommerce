import { gql } from '@apollo/client';

const GET_DRAFT_ORDER = gql`
  query getDraftOrder($id: ID!) {
    draftOrder(id: $id) {
      id
      name
      createdAt
      status
      tags
      email
      invoiceUrl
      metafield(namespace: "custom", key: "quote_status") {
        value
      }
      customer {
        id
        firstName
        lastName
        email
      }
      shippingAddress {
          name
          address1
          address2
          city
          provinceCode
          zip
          country
          phone
      }
      purchasingEntity {
        ... on PurchasingCompany {
          company {
            name
          }
          location {
            name
          }
        }
      }
      lineItems(first: 20) {
        edges {
          node {
            title
            quantity
            image{
              url
              altText
            }
            variant {
              id
              image {
                url
                altText
              }
            }
            originalUnitPrice
          }
        }
      }
      subtotalPrice
      totalShippingPriceSet {
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
      totalPrice
      totalDiscountsSet{
        shopMoney {
          amount
          currencyCode
        }
      }
      shippingLine {
        title
        discountedPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
      }
    }
  }
`;

export default GET_DRAFT_ORDER;
