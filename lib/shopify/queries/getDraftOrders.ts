import { gql } from '@apollo/client'; // or 'graphql-tag' if you're not using Apollo

const GET_DRAFT_ORDERS = gql`
  query getDraftOrders($query: String!) {
    draftOrders(first: 20, query: $query) {
      edges {
        node {
          id
          name
          createdAt
          status  # ✅ Added this field to fetch the draft order status
          metafield(namespace: "custom", key: "quote_status") {
            value
          }
          tags
          customer {
            id
            firstName
            lastName
            email
          }
          lineItems(first: 10) {
            edges {
              node {
                title
                quantity
                variant {
                  id
                  image {
                    url
                    altText
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

export default GET_DRAFT_ORDERS;
