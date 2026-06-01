"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Edit3,
  ImageIcon,
  PackageCheck,
  Plus,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Category = Database["public"]["Tables"]["categories"]["Row"];
type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
type Variant = Database["public"]["Tables"]["product_variants"]["Row"];

type ProductForm = {
  categoryId: string;
  description: string;
  isNew: boolean;
  isSale: boolean;
  label: string;
  name: string;
  originalPrice: string;
  price: string;
  releaseOrder: string;
  shortDescription: string;
  slug: string;
  status: string;
};

const initialForm: ProductForm = {
  categoryId: "",
  description: "",
  isNew: false,
  isSale: false,
  label: "",
  name: "",
  originalPrice: "",
  price: "",
  releaseOrder: "0",
  shortDescription: "",
  slug: "",
  status: "active",
};

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function productToForm(product: Product): ProductForm {
  return {
    categoryId: product.category_id ?? "",
    description: product.description ?? "",
    isNew: Boolean(product.is_new),
    isSale: Boolean(product.is_sale),
    label: product.label ?? "",
    name: product.name,
    originalPrice: product.original_price?.toString() ?? "",
    price: product.price.toString(),
    releaseOrder: product.release_order?.toString() ?? "0",
    shortDescription: product.short_description ?? "",
    slug: product.slug,
    status: product.status,
  };
}

export function AdminProductsView() {
  const supabase = createSupabaseBrowserClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isSaving, setIsSaving] = useState(false);

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const productImagesByProductId = useMemo(() => {
    const nextMap = new Map<string, ProductImage[]>();

    productImages.forEach((image) => {
      const nextImages = nextMap.get(image.product_id) ?? [];
      nextImages.push(image);
      nextMap.set(image.product_id, nextImages);
    });

    return nextMap;
  }, [productImages]);

  const variantsByProductId = useMemo(() => {
    const nextMap = new Map<string, Variant[]>();

    variants.forEach((variant) => {
      const nextVariants = nextMap.get(variant.product_id) ?? [];
      nextVariants.push(variant);
      nextMap.set(variant.product_id, nextVariants);
    });

    return nextMap;
  }, [variants]);

  const productReadiness = useMemo(() => {
    return products.map((product) => {
      const images = productImagesByProductId.get(product.id) ?? [];
      const productVariants = variantsByProductId.get(product.id) ?? [];
      const activeVariants = productVariants.filter(
        (variant) => variant.is_active !== false,
      );
      const totalStock = activeVariants.reduce(
        (total, variant) => total + (variant.stock_quantity ?? 0),
        0,
      );
      const hasMainImage = images.some(
        (image) => image.image_type === "main" && image.image_url,
      );
      const hasActiveVariant = activeVariants.length > 0;
      const hasStock = totalStock > 0;
      const hasValidPrice = product.price > 0;
      const isActive = product.status === "active";
      const issues = [
        !isActive ? "Draft" : null,
        !hasMainImage ? "Missing image" : null,
        !hasActiveVariant ? "No variants" : null,
        !hasStock ? "No stock" : null,
        !hasValidPrice ? "No price" : null,
      ].filter((issue): issue is string => Boolean(issue));

      return {
        activeVariants: activeVariants.length,
        hasMainImage,
        id: product.id,
        isReady: issues.length === 0,
        issues,
        totalStock,
      };
    });
  }, [productImagesByProductId, products, variantsByProductId]);

  const readinessByProductId = useMemo(
    () => new Map(productReadiness.map((item) => [item.id, item])),
    [productReadiness],
  );

  const readinessSummary = useMemo(
    () => ({
      missingImage: productReadiness.filter((item) =>
        item.issues.includes("Missing image"),
      ).length,
      noStock: productReadiness.filter((item) =>
        item.issues.includes("No stock"),
      ).length,
      ready: productReadiness.filter((item) => item.isReady).length,
    }),
    [productReadiness],
  );

  const loadProducts = useCallback(async () => {
    const client = supabase;

    if (!client) {
      return;
    }

    const [
      productsResult,
      categoriesResult,
      imagesResult,
      variantsResult,
    ] = await Promise.all([
      client
        .from("products")
        .select("*")
        .order("release_order", { ascending: false }),
      client.from("categories").select("*").order("sort_order"),
      client.from("product_images").select("*").order("sort_order"),
      client.from("product_variants").select("*"),
    ]);

    const firstError =
      productsResult.error ??
      categoriesResult.error ??
      imagesResult.error ??
      variantsResult.error;

    if (firstError) {
      setError(
        firstError.message ?? "Could not load product readiness details.",
      );
    }

    setProducts(productsResult.data ?? []);
    setCategories(categoriesResult.data ?? []);
    setProductImages(imagesResult.data ?? []);
    setVariants(variantsResult.data ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadProducts]);

  function updateForm<K extends keyof ProductForm>(field: K, value: ProductForm[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
      slug:
        field === "name" && !editingId
          ? slugify(String(value))
          : current.slug,
    }));
    setError("");
    setNotice("");
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const price = Number(form.price);

    if (!form.name.trim() || !form.slug.trim() || !Number.isFinite(price)) {
      setError("Name, slug, and valid price are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    const payload = {
      category_id: form.categoryId || null,
      description: form.description.trim() || null,
      is_new: form.isNew,
      is_sale: form.isSale,
      label: form.label.trim() || null,
      name: form.name.trim(),
      original_price: form.originalPrice ? Number(form.originalPrice) : null,
      price,
      release_order: Number(form.releaseOrder) || 0,
      short_description: form.shortDescription.trim() || null,
      slug: form.slug.trim(),
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = editingId
      ? await supabase.from("products").update(payload).eq("id", editingId)
      : await supabase.from("products").insert(payload);

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setNotice(editingId ? "Product updated." : "Product created.");
    resetForm();
    await loadProducts();
  }

  async function updateStatus(product: Product, status: string) {
    if (!supabase) {
      return;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, status } : item,
      ),
    );
  }

  if (!supabase) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-neutral-500">
            Admin
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.07em]">
            Products
          </h2>
        </div>
        <Button variant="outline" onClick={() => void loadProducts()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {(error || notice) && (
        <p
          className={`rounded-md border px-4 py-3 text-sm font-bold uppercase ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-neutral-200 bg-neutral-100 text-neutral-700"
          }`}
        >
          {error || notice}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                Ready To Sell
              </p>
              <p className="mt-2 text-3xl font-black uppercase leading-none">
                {readinessSummary.ready}
              </p>
            </div>
            <CheckCircle2 className="size-6 text-neutral-500" aria-hidden="true" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                Missing Image
              </p>
              <p className="mt-2 text-3xl font-black uppercase leading-none">
                {readinessSummary.missingImage}
              </p>
            </div>
            <ImageIcon className="size-6 text-neutral-500" aria-hidden="true" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                No Stock
              </p>
              <p className="mt-2 text-3xl font-black uppercase leading-none">
                {readinessSummary.noStock}
              </p>
            </div>
            <PackageCheck className="size-6 text-neutral-500" aria-hidden="true" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr] xl:items-start">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Product" : "Create Product"}</CardTitle>
            <CardDescription>
              Product media and variants can be managed after the product exists.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  placeholder="Black Jacket 01"
                />
              </div>
              <div className="grid gap-2">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(event) => updateForm("slug", event.target.value)}
                  placeholder="black-jacket-01"
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={form.categoryId}
                  onChange={(event) =>
                    updateForm("categoryId", event.target.value)
                  }
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => updateForm("price", event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.originalPrice}
                    onChange={(event) =>
                      updateForm("originalPrice", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onChange={(event) => updateForm("status", event.target.value)}
                  >
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="archived">archived</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Release Order</Label>
                  <Input
                    type="number"
                    value={form.releaseOrder}
                    onChange={(event) =>
                      updateForm("releaseOrder", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Label</Label>
                <Input
                  value={form.label}
                  onChange={(event) => updateForm("label", event.target.value)}
                  placeholder="Outerwear"
                />
              </div>
              <div className="grid gap-2">
                <Label>Short Description</Label>
                <Textarea
                  value={form.shortDescription}
                  onChange={(event) =>
                    updateForm("shortDescription", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs font-black uppercase">
                  <input
                    type="checkbox"
                    checked={form.isSale}
                    onChange={(event) => updateForm("isSale", event.target.checked)}
                    className="size-4 accent-black"
                  />
                  Sale
                </label>
                <label className="flex items-center gap-2 text-xs font-black uppercase">
                  <input
                    type="checkbox"
                    checked={form.isNew}
                    onChange={(event) => updateForm("isNew", event.target.checked)}
                    className="size-4 accent-black"
                  />
                  New
                </label>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="submit" disabled={isSaving}>
                  <Plus className="size-4" aria-hidden="true" />
                  {isSaving ? "Saving" : editingId ? "Update" : "Create"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catalog</CardTitle>
            <CardDescription>
              {isLoading ? "Loading products..." : `${products.length} products`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const readiness = readinessByProductId.get(product.id);

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-black uppercase">{product.name}</p>
                        <p className="mt-1 text-xs font-bold uppercase text-neutral-500">
                          {product.slug}
                        </p>
                      </TableCell>
                      <TableCell>
                        {product.category_id
                          ? categoryNameById.get(product.category_id) ?? "Unknown"
                          : "None"}
                      </TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>
                        <div className="grid gap-2">
                          <Badge
                            variant={readiness?.isReady ? "default" : "secondary"}
                          >
                            {readiness?.isReady ? "Ready" : "Needs Work"}
                          </Badge>
                          <div className="flex flex-wrap gap-1">
                            {readiness?.issues.length ? (
                              readiness.issues.map((issue) => (
                                <Badge key={issue} variant="outline">
                                  <TriangleAlert
                                    className="size-3"
                                    aria-hidden="true"
                                  />
                                  {issue}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline">
                                Stock {readiness?.totalStock ?? 0}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "active"
                              ? "default"
                              : product.status === "archived"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              setEditingId(product.id);
                              setForm(productToForm(product));
                              setError("");
                              setNotice("");
                            }}
                            aria-label={`Edit ${product.name}`}
                          >
                            <Edit3 className="size-4" aria-hidden="true" />
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/admin/images">Images</Link>
                          </Button>
                          <Button asChild variant="outline" size="sm">
                            <Link href="/admin/inventory">Stock</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              void updateStatus(
                                product,
                                product.status === "active" ? "draft" : "active",
                              )
                            }
                          >
                            {product.status === "active" ? "Draft" : "Activate"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
