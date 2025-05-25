// lib/shopify/mutations/tagsRemove.ts
import { gql } from 'graphql-request';

const TAGS_REMOVE_MUTATION = gql`
  mutation tagsRemove($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
      userErrors {
        field
        message
      }
      node {
        id
      }
    }
  }
`;

export default TAGS_REMOVE_MUTATION;
