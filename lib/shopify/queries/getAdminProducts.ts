import productFragment from '../fragments/productAdmin';

export const getAdminProductQuery = /* GraphQL */ `
  query getProduct($id: ID!, $companyLocationId: ID!) {
    product(id: $id) {
      ...product
      variants(first: 5) {
        edges {
          node {
            contextualPricing(context: { companyLocationId: $companyLocationId }) {
              price {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  }
  ${productFragment}
`;

export const getAdminProductsQuery = /* GraphQL */ `
  query getProducts($companyLocationId: ID!) {
    products(first: 100) {
      edges {
        node {
          ...product
          variants(first: 5) {
            edges {
              node {
                contextualPricing(context: { companyLocationId: $companyLocationId }) {
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  ${productFragment}
`;
