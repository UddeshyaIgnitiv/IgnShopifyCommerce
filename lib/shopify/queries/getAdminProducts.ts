import productFragment from '../fragments/productAdmin';

export const getAdminProductQuery = /* GraphQL */ `
  query getProduct($id: ID!, $companyLocationId: ID!) {
  product(id: $id) {
    ...product
  }
}
${productFragment}
`;

export const getAdminProductsQuery = /* GraphQL */ `
  query getProducts($companyLocationId: ID!, $cursor: String) {
    products(first: 100, after: $cursor) {
      edges {
        cursor
        node {
          ...product
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
  ${productFragment}
`;

