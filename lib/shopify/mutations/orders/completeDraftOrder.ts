const COMPLETE_DRAFT_ORDER = `
  mutation draftOrderComplete($id: ID!) {
    draftOrderComplete(id: $id) {
      order {
        id
        name
        statusUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export default COMPLETE_DRAFT_ORDER;
