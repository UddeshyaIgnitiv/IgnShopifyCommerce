import { gql } from 'graphql-request';

const TAGS_ADD_MUTATION = gql`
  mutation tagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
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

export default TAGS_ADD_MUTATION;
