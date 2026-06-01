export type ProductCategory =
  | "Outerwear"
  | "Tops"
  | "Bottoms"
  | "Accessories";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export type Product = {
  id: string;
  databaseId?: string;
  name: string;
  category: ProductCategory;
  label: string;
  image: string;
  images: string[];
  hoverImage?: string;
  price: number;
  originalPrice?: number;
  description: string;
  details: string[];
  sizes: string[];
  stockStatus: StockStatus;
  inventory: number;
  isNew?: boolean;
  isSale?: boolean;
  releaseOrder: number;
};
