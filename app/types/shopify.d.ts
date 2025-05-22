// app/types/shopify.d.ts

export interface Metafield {
  key: string;
  value: string;
}

export type DraftOrderInput = {
  customerId: string;
  lineItems: {
    title: string;
    quantity: number;
  }[];
  note?: string;
};


export interface Customer {
  metafields: Metafield[];
}

export interface GetCustomerRoleResponse {
  customer: Customer | null;
}

export interface GetCustomerRoleVariables {
  customerAccessToken: string;
}
