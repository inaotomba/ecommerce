import { products as fallbackProducts } from "@/data/products";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product, ProductCategory, StockStatus } from "@/types/product";

type CatalogCategory = {
  name: string | null;
};

type CatalogImage = {
  image_type: string | null;
  image_url: string | null;
  sort_order: number | null;
};

type CatalogVariant = {
  is_active: boolean | null;
  size: string | null;
  stock_quantity: number | null;
};

type CatalogProductRow = {
  id: string;
  categories: CatalogCategory | CatalogCategory[] | null;
  description: string | null;
  is_new: boolean | null;
  is_sale: boolean | null;
  label: string | null;
  name: string;
  original_price: number | string | null;
  price: number | string;
  product_images: CatalogImage[] | null;
  product_variants: CatalogVariant[] | null;
  release_order: number | null;
  slug: string;
};

const validCategories: ProductCategory[] = [
  "Outerwear",
  "Tops",
  "Bottoms",
  "Accessories",
];

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return Number(value);
}

function toCategory(value: string | null | undefined): ProductCategory {
  const category = validCategories.find((item) => item === value);

  return category ?? "Outerwear";
}

function getCategoryName(category: CatalogProductRow["categories"]) {
  if (Array.isArray(category)) {
    return category[0]?.name;
  }

  return category?.name;
}

function getStockStatus(inventory: number): StockStatus {
  if (inventory <= 0) {
    return "out-of-stock";
  }

  if (inventory <= 5) {
    return "low-stock";
  }

  return "in-stock";
}

function mapCatalogProduct(row: CatalogProductRow): Product {
  const images = [...(row.product_images ?? [])]
    .filter((image) => Boolean(image.image_url))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const mainImage =
    images.find((image) => image.image_type === "main")?.image_url ??
    images[0]?.image_url ??
    "/window.svg";
  const hoverImage = images.find((image) => image.image_type === "hover")?.image_url;
  const galleryImages = images
    .filter((image) => image.image_type !== "hover")
    .map((image) => image.image_url)
    .filter((image): image is string => Boolean(image));
  const variants = row.product_variants ?? [];
  const sizes = variants
    .map((variant) => variant.size)
    .filter((size): size is string => Boolean(size));
  const inventory = variants.reduce(
    (total, variant) => total + (variant.stock_quantity ?? 0),
    0,
  );

  return {
    id: row.slug,
    databaseId: row.id,
    category: toCategory(getCategoryName(row.categories)),
    description: row.description ?? "",
    details: [],
    hoverImage: hoverImage ?? undefined,
    image: mainImage,
    images: galleryImages.length > 0 ? galleryImages : [mainImage],
    inventory,
    isNew: Boolean(row.is_new),
    isSale: Boolean(row.is_sale),
    label: row.label ?? getCategoryName(row.categories) ?? "Product",
    name: row.name,
    originalPrice: row.original_price ? toNumber(row.original_price) : undefined,
    price: toNumber(row.price),
    releaseOrder: row.release_order ?? 0,
    sizes: sizes.length > 0 ? sizes : ["OS"],
    stockStatus: getStockStatus(inventory),
  };
}

export async function getCatalogProducts() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return fallbackProducts;
  }

  const { data, error } = await supabase
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        label,
        description,
        price,
        original_price,
        is_sale,
        is_new,
        release_order,
        categories(name),
        product_images(image_url, image_type, sort_order),
        product_variants(size, stock_quantity, is_active)
      `,
    )
    .eq("status", "active")
    .order("release_order", { ascending: false });

  if (error || !data || data.length === 0) {
    return fallbackProducts;
  }

  return (data as unknown as CatalogProductRow[]).map(mapCatalogProduct);
}

export async function getCatalogProduct(id: string) {
  const products = await getCatalogProducts();

  return products.find((product) => product.id === id);
}

export function getCatalogCategories(products: Product[]) {
  return validCategories.filter((category) =>
    products.some((product) => product.category === category),
  );
}
