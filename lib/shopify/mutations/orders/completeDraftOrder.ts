import { gql } from 'graphql-request';

const COMPLETE_DRAFT_ORDER = gql`
  mutation draftOrderComplete($id: ID!) {
    draftOrderComplete(id: $id) {
      draftOrder {
        id
        name
        status
        lineItems(first: 10) {
          edges {
            node {
              id
              title
              quantity
              variant {
                id
                title
                price
                image {
                  src
                  altText
                }
              }
            }
          }
        }
        customer {
          id
          displayName
          email
        }
        createdAt
        updatedAt
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default COMPLETE_DRAFT_ORDER;
