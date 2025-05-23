import { gql } from '@apollo/client'; // or 'graphql-tag' if you're not using Apollo

const GET_PENDING_DRAFT_ORDERS = gql`
  query getDraftOrders($query: String!) {
    draftOrders(first: 20, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          note2
          tags
          customer {
            displayName
          }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
              }
            }
          }
        }
      }
    }
  }
`;

export default GET_PENDING_DRAFT_ORDERS;
