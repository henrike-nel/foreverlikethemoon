export interface CheckoutOrder {
  reference: string;
  total: number;
  currency: "ZAR";
  customer_email: string;
  product_name: string;
}

export interface PaymentGateway {
  createCheckout(order: CheckoutOrder): Promise<{ redirectUrl: string; gatewayRef: string }>;
  verifyWebhook(req: Request): Promise<{ gatewayRef: string; status: "paid" | "failed"; amount: number }>;
}

export class CardGatewayNotConfigured implements PaymentGateway {
  async createCheckout(_order: CheckoutOrder): Promise<{ redirectUrl: string; gatewayRef: string }> {
    throw new Error("Card checkout is not configured");
  }

  async verifyWebhook(_req: Request): Promise<{ gatewayRef: string; status: "paid" | "failed"; amount: number }> {
    throw new Error("Card checkout is not configured");
  }
}
