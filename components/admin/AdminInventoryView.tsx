"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, RefreshCw, Search } from "lucide-react";
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
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type Variant = Database["public"]["Tables"]["product_variants"]["Row"];

type VariantForm = {
  productId: string;
  size: string;
  sku: string;
  stockQuantity: string;
};

const initialForm: VariantForm = {
  productId: "",
  size: "",
  sku: "",
  stockQuantity: "0",
};

export function AdminInventoryView() {
  const supabase = createSupabaseBrowserClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [form, setForm] = useState<VariantForm>(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isSaving, setIsSaving] = useState(false);

  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const sortedVariants = useMemo(
    () =>
      [...variants].sort((a, b) => {
        const productA = productById.get(a.product_id)?.name ?? "";
        const productB = productById.get(b.product_id)?.name ?? "";

        return `${productA}-${a.size}`.localeCompare(`${productB}-${b.size}`);
      }),
    [productById, variants],
  );
  const filteredVariants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sortedVariants.filter((variant) => {
      const product = productById.get(variant.product_id);
      const stock = variant.stock_quantity ?? 0;
      const status =
        !variant.is_active
          ? "inactive"
          : stock <= 0
            ? "out"
            : stock <= 5
              ? "low"
              : "in";
      const matchesStatus = statusFilter === "all" || statusFilter === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        product?.name.toLowerCase().includes(normalizedQuery) ||
        variant.size.toLowerCase().includes(normalizedQuery) ||
        variant.sku?.toLowerCase().includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [productById, query, sortedVariants, statusFilter]);
  const inventoryStats = useMemo(() => {
    const activeVariants = variants.filter((variant) => variant.is_active);
    const totalUnits = variants.reduce(
      (total, variant) => total + (variant.stock_quantity ?? 0),
      0,
    );
    const lowStock = activeVariants.filter((variant) => {
      const stock = variant.stock_quantity ?? 0;

      return stock > 0 && stock <= 5;
    }).length;
    const outOfStock = activeVariants.filter(
      (variant) => (variant.stock_quantity ?? 0) <= 0,
    ).length;

    return {
      active: activeVariants.length,
      lowStock,
      outOfStock,
      totalUnits,
    };
  }, [variants]);

  const loadInventory = useCallback(async () => {
    const client = supabase;

    if (!client) {
      return;
    }

    const [productsResult, variantsResult] = await Promise.all([
      client.from("products").select("*").order("name"),
      client.from("product_variants").select("*"),
    ]);

    if (productsResult.error ?? variantsResult.error) {
      setError(
        productsResult.error?.message ??
          variantsResult.error?.message ??
          "Could not load inventory.",
      );
    }

    setProducts(productsResult.data ?? []);
    setVariants(variantsResult.data ?? []);
    setStockDrafts(
      Object.fromEntries(
        (variantsResult.data ?? []).map((variant) => [
          variant.id,
          String(variant.stock_quantity ?? 0),
        ]),
      ),
    );
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadInventory();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadInventory]);

  function updateForm<K extends keyof VariantForm>(field: K, value: VariantForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    if (!form.productId || !form.size.trim()) {
      setError("Product and size are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    const { error: saveError } = await supabase.from("product_variants").insert({
      is_active: true,
      product_id: form.productId,
      size: form.size.trim().toUpperCase(),
      sku: form.sku.trim() || null,
      stock_quantity: Number(form.stockQuantity) || 0,
      updated_at: new Date().toISOString(),
    });

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setNotice("Variant created.");
    setForm(initialForm);
    await loadInventory();
  }

  async function updateVariant(
    variant: Variant,
    updates: Database["public"]["Tables"]["product_variants"]["Update"],
  ) {
    if (!supabase) {
      return;
    }

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", variant.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setVariants((current) =>
      current.map((item) =>
        item.id === variant.id ? { ...item, ...updates } : item,
      ),
    );

    if (updates.stock_quantity !== undefined) {
      setStockDrafts((current) => ({
        ...current,
        [variant.id]: String(updates.stock_quantity ?? 0),
      }));
    }
  }

  function getVariantState(variant: Variant) {
    const stock = variant.stock_quantity ?? 0;

    if (!variant.is_active) {
      return {
        badge: "inactive",
        helper: "Hidden from active selling flows.",
        variant: "outline" as const,
      };
    }

    if (stock <= 0) {
      return {
        badge: "out",
        helper: "Needs restock before selling.",
        variant: "destructive" as const,
      };
    }

    if (stock <= 5) {
      return {
        badge: "low",
        helper: "Low stock. Consider replenishing.",
        variant: "secondary" as const,
      };
    }

    return {
      badge: "in stock",
      helper: "Healthy stock level.",
      variant: "default" as const,
    };
  }

  function updateStockDraft(variant: Variant, nextStock: number) {
    setStockDrafts((current) => ({
      ...current,
      [variant.id]: String(Math.max(nextStock, 0)),
    }));
  }

  async function saveStockDraft(variant: Variant) {
    const nextStock = Number(stockDrafts[variant.id] ?? 0);

    await updateVariant(variant, {
      stock_quantity: Number.isFinite(nextStock) ? Math.max(nextStock, 0) : 0,
    });
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
            Inventory
          </h2>
        </div>
        <Button variant="outline" onClick={() => void loadInventory()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Units", inventoryStats.totalUnits],
          ["Active Variants", inventoryStats.active],
          ["Low Stock", inventoryStats.lowStock],
          ["Out Of Stock", inventoryStats.outOfStock],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black leading-none tracking-[-0.06em]">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
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

      <div className="grid gap-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>New Variant</CardTitle>
                <CardDescription>
                  Add a size/SKU row to an existing product.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-[minmax(220px,1.4fr)_120px_minmax(180px,1fr)_140px_auto] md:items-end"
            >
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select
                  value={form.productId}
                  onChange={(event) => updateForm("productId", event.target.value)}
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Size</Label>
                <Input
                  value={form.size}
                  onChange={(event) => updateForm("size", event.target.value)}
                  placeholder="M"
                />
              </div>
              <div className="grid gap-2">
                <Label>SKU</Label>
                <Input
                  value={form.sku}
                  onChange={(event) => updateForm("sku", event.target.value)}
                  placeholder="BLACK-JACKET-01-M"
                />
              </div>
              <div className="grid gap-2">
                <Label>Stock Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.stockQuantity}
                  onChange={(event) =>
                    updateForm("stockQuantity", event.target.value)
                  }
                />
              </div>
              <Button type="submit" disabled={isSaving}>
                <Plus className="size-4" aria-hidden="true" />
                {isSaving ? "Saving" : "Create Variant"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Variant Stock</CardTitle>
                <CardDescription>
                  {isLoading ? "Loading variants..." : `${variants.length} variants`}
                </CardDescription>
              </div>
              <p className="text-xs font-black uppercase text-neutral-500">
                {filteredVariants.length} visible
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px]">
              <label className="flex h-11 items-center gap-3 rounded-md border border-neutral-200 px-3">
                <Search className="size-4 text-neutral-500" aria-hidden="true" />
                <span className="sr-only">Search inventory</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search product, size, or SKU"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm font-bold uppercase outline-none placeholder:text-neutral-400"
                />
              </label>
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All status</option>
                <option value="in">In stock</option>
                <option value="low">Low stock</option>
                <option value="out">Out of stock</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            <div className="grid gap-3">
              {filteredVariants.map((variant) => {
                const product = productById.get(variant.product_id);
                const stock = variant.stock_quantity ?? 0;
                const draftStock = stockDrafts[variant.id] ?? String(stock);
                const nextStock = Number(draftStock);
                const hasChanged = Number.isFinite(nextStock) && nextStock !== stock;
                const state = getVariantState(variant);

                return (
                  <article
                    key={variant.id}
                    className="rounded-lg border border-neutral-200 p-4 transition hover:bg-neutral-50"
                  >
                    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(260px,1fr)_260px_260px] xl:items-center">
                      <div className="min-w-0 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={state.variant}>{state.badge}</Badge>
                          <span className="rounded-md bg-neutral-100 px-2 py-1 text-xs font-black uppercase">
                            Size {variant.size}
                          </span>
                        </div>
                        <h3 className="mt-3 break-words text-lg font-black uppercase leading-none tracking-[-0.04em]">
                          {product?.name ?? "Unknown Product"}
                        </h3>
                        <p className="mt-2 break-words text-xs font-bold uppercase text-neutral-500">
                          {variant.sku ?? "No SKU"} / {state.helper}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <Label>Stock Quantity</Label>
                        <div className="mt-2 flex h-11 items-center rounded-md border border-neutral-200 bg-white">
                          <button
                            type="button"
                            onClick={() => updateStockDraft(variant, stock - 1)}
                            className="flex size-11 items-center justify-center rounded-l-md transition hover:bg-neutral-100"
                            aria-label="Decrease stock"
                          >
                            <Minus className="size-4" aria-hidden="true" />
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={draftStock}
                            onChange={(event) =>
                              setStockDrafts((current) => ({
                                ...current,
                                [variant.id]: event.target.value,
                              }))
                            }
                            className="h-full min-w-0 flex-1 border-x border-neutral-200 text-center text-sm font-black outline-none"
                            aria-label={`${product?.name ?? "Variant"} stock`}
                          />
                          <button
                            type="button"
                            onClick={() => updateStockDraft(variant, stock + 1)}
                            className="flex size-11 items-center justify-center rounded-r-md transition hover:bg-neutral-100"
                            aria-label="Increase stock"
                          >
                            <Plus className="size-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        <Button
                          size="sm"
                          disabled={!hasChanged}
                          onClick={() => void saveStockDraft(variant)}
                        >
                          Save Stock
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            void updateVariant(variant, {
                              is_active: !variant.is_active,
                            })
                          }
                        >
                          {variant.is_active ? "Pause Selling" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredVariants.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 p-8 text-center">
                  <p className="text-sm font-black uppercase text-neutral-500">
                    No variants match this filter.
                  </p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
