// // app/graphql/queries.ts
// import { gql } from '@apollo/client';

// export const GET_CUSTOMER_ROLE = gql`
//   query GetCustomerRole($customerAccessToken: String!) {
//     customer(customerAccessToken: $customerAccessToken) {
//       metafields(namespace: "b2b", keys: ["role"]) {
//         key
//         value
//       }
//     }
//   }
// `;


export const GET_CUSTOMER_ROLE_ADMIN = `
  query GetCustomerRoleAdmin($id: ID!) {
    customer(id: $id) {
      id
      email
      metafields(namespace: "b2b", first: 10) {
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
`;
