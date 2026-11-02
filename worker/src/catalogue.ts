export const SHIPPING_FLAT_ZAR = 0;

export const PRODUCTS = {
  "digital-wedding-planner": { name: "Digital Wedding Planner", type: "digital", price: 300 },
  "wedding-planner": { name: "Wedding Planner", type: "physical", price: 400 },
  "wedding-emergency-kit": { name: "Wedding Emergency Kit", type: "physical", price: 450 },
} as const;

export type ProductId = keyof typeof PRODUCTS;
export type ProductType = (typeof PRODUCTS)[ProductId]["type"];

export interface Business {
  legalName: string;
  status: string;
  address: string;
  contact: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchCode: string;
  payshapId: string;
  snapscanUrl: string;
  whatsapp: string;
  ownerEmail: string;
  fromEmail: string;
}

export function shippingFlatZar(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return SHIPPING_FLAT_ZAR;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return SHIPPING_FLAT_ZAR;
  return n;
}

export function productById(id: string) {
  if (!Object.prototype.hasOwnProperty.call(PRODUCTS, id)) return null;
  return PRODUCTS[id as ProductId];
}

export function quote(productId: string, qty: number, shippingFlat: number) {
  const product = productById(productId);
  if (!product) return null;
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) return null;
  const shipping = product.type === "physical" ? shippingFlat : 0;
  return {
    productId: productId as ProductId,
    name: product.name,
    type: product.type,
    unitPrice: product.price,
    qty,
    shipping,
    total: product.price * qty + shipping,
    currency: "ZAR" as const,
  };
}

export function publicBusiness(business: Business) {
  return {
    legalName: business.legalName,
    status: business.status,
    address: business.address,
    contact: business.contact,
    bankName: business.bankName,
    accountName: business.accountName,
    accountNumber: business.accountNumber,
    branchCode: business.branchCode,
    payshapId: business.payshapId,
    snapscanUrl: business.snapscanUrl,
    whatsapp: business.whatsapp,
  };
}

export function cataloguePayload(shippingFlat: number) {
  return {
    products: Object.entries(PRODUCTS).map(([id, product]) => ({
      id,
      name: product.name,
      type: product.type,
      price: product.price,
    })),
    shippingFlatZar: shippingFlat,
  };
}

function filled(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : fallback;
}

export function businessFromEnv(env: {
  BUSINESS_LEGAL_NAME?: string;
  BUSINESS_STATUS?: string;
  BUSINESS_ADDRESS?: string;
  BUSINESS_CONTACT?: string;
  BUSINESS_BANK_NAME?: string;
  BUSINESS_ACCOUNT_NAME?: string;
  BUSINESS_ACCOUNT_NUMBER?: string;
  BUSINESS_BRANCH_CODE?: string;
  BUSINESS_PAYSHAP_ID?: string;
  SNAPSCAN_URL?: string;
  BUSINESS_WHATSAPP?: string;
  OWNER_EMAIL?: string;
  RESEND_FROM?: string;
}): Business {
  return {
    legalName: filled(env.BUSINESS_LEGAL_NAME, "__OWNER_TODO__"),
    status: filled(env.BUSINESS_STATUS, "__OWNER_TODO__"),
    address: filled(env.BUSINESS_ADDRESS, "__OWNER_TODO__"),
    contact: filled(env.BUSINESS_CONTACT, "__OWNER_TODO__"),
    bankName: filled(env.BUSINESS_BANK_NAME, "__OWNER_TODO__"),
    accountName: filled(env.BUSINESS_ACCOUNT_NAME, "__OWNER_TODO__"),
    accountNumber: filled(env.BUSINESS_ACCOUNT_NUMBER, "__OWNER_TODO__"),
    branchCode: filled(env.BUSINESS_BRANCH_CODE, "__OWNER_TODO__"),
    payshapId: filled(env.BUSINESS_PAYSHAP_ID, "__OWNER_TODO__"),
    snapscanUrl: env.SNAPSCAN_URL?.trim() ?? "",
    whatsapp: env.BUSINESS_WHATSAPP?.trim() ?? "",
    ownerEmail: filled(env.OWNER_EMAIL, "__OWNER_TODO__"),
    fromEmail: filled(env.RESEND_FROM, "Forever Like The Moon <orders@foreverlikethemoon.com>"),
  };
}
