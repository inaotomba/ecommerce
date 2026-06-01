"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, ImagePlus, RefreshCw, Star, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type Product = Database["public"]["Tables"]["products"]["Row"];
type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
type ImageType = "main" | "hover" | "gallery";

type ImageForm = {
  altText: string;
  imageType: ImageType;
  imageUrl: string;
  productId: string;
  sortOrder: string;
};

const initialForm: ImageForm = {
  altText: "",
  imageType: "gallery",
  imageUrl: "",
  productId: "",
  sortOrder: "1",
};

function imageTypeVariant(imageType: string | null) {
  if (imageType === "main") {
    return "default" as const;
  }

  if (imageType === "hover") {
    return "secondary" as const;
  }

  return "outline" as const;
}

function toImageType(value: string | null): ImageType {
  if (value === "main" || value === "hover") {
    return value;
  }

  return "gallery";
}

export function AdminProductImagesView() {
  const supabase = createSupabaseBrowserClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ImageForm>(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isSaving, setIsSaving] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );
  const selectedImages = useMemo(
    () =>
      images
        .filter((image) => image.product_id === selectedProductId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [images, selectedProductId],
  );
  const imageCounts = useMemo(
    () => ({
      gallery: selectedImages.filter((image) => image.image_type === "gallery")
        .length,
      hover: selectedImages.filter((image) => image.image_type === "hover").length,
      main: selectedImages.filter((image) => image.image_type === "main").length,
      total: selectedImages.length,
    }),
    [selectedImages],
  );

  const loadImages = useCallback(async () => {
    const client = supabase;

    if (!client) {
      return;
    }

    const [productsResult, imagesResult] = await Promise.all([
      client.from("products").select("*").order("name"),
      client
        .from("product_images")
        .select("*")
        .order("sort_order", { ascending: true }),
    ]);

    if (productsResult.error ?? imagesResult.error) {
      setError(
        productsResult.error?.message ??
          imagesResult.error?.message ??
          "Could not load product images.",
      );
    }

    const nextProducts = productsResult.data ?? [];
    const nextImages = imagesResult.data ?? [];

    setProducts(nextProducts);
    setImages(nextImages);
    setSelectedProductId((current) => current || nextProducts[0]?.id || "");
    setForm((current) => ({
      ...current,
      productId: current.productId || nextProducts[0]?.id || "",
    }));
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadImages();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadImages]);

  function updateForm<K extends keyof ImageForm>(field: K, value: ImageForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setNotice("");
  }

  function resetForm(nextProductId = selectedProductId) {
    setEditingId(null);
    setForm({
      ...initialForm,
      productId: nextProductId,
      sortOrder: String(selectedImages.length + 1),
    });
    setError("");
    setNotice("");
  }

  function startEditing(image: ProductImage) {
    setEditingId(image.id);
    setSelectedProductId(image.product_id);
    setForm({
      altText: image.alt_text ?? "",
      imageType: toImageType(image.image_type),
      imageUrl: image.image_url,
      productId: image.product_id,
      sortOrder: String(image.sort_order ?? 1),
    });
    setError("");
    setNotice("");
  }

  async function clearExistingType(productId: string, imageType: ImageType) {
    if (!supabase || imageType === "gallery") {
      return;
    }

    let query = supabase
      .from("product_images")
      .update({ image_type: "gallery" })
      .eq("product_id", productId)
      .eq("image_type", imageType);

    if (editingId) {
      query = query.neq("id", editingId);
    }

    const { error: updateError } = await query;

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      return;
    }

    const productId = form.productId || selectedProductId;
    const sortOrder = Number(form.sortOrder);

    if (!productId || !form.imageUrl.trim()) {
      setError("Product and image URL are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    try {
      await clearExistingType(productId, form.imageType);

      const payload = {
        alt_text: form.altText.trim() || null,
        image_type: form.imageType,
        image_url: form.imageUrl.trim(),
        product_id: productId,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 1,
      };

      const { error: saveError } = editingId
        ? await supabase.from("product_images").update(payload).eq("id", editingId)
        : await supabase.from("product_images").insert(payload);

      if (saveError) {
        throw new Error(saveError.message);
      }

      setNotice(editingId ? "Image updated." : "Image added.");
      resetForm(productId);
      await loadImages();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Image save failed.");
    } finally {
      setIsSaving(false);
    }
  }

  async function updateImageType(image: ProductImage, imageType: ImageType) {
    if (!supabase) {
      return;
    }

    setError("");
    setNotice("");

    try {
      if (imageType !== "gallery") {
        const { error: clearError } = await supabase
          .from("product_images")
          .update({ image_type: "gallery" })
          .eq("product_id", image.product_id)
          .eq("image_type", imageType)
          .neq("id", image.id);

        if (clearError) {
          throw new Error(clearError.message);
        }
      }

      const { error: updateError } = await supabase
        .from("product_images")
        .update({ image_type: imageType })
        .eq("id", image.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setImages((current) =>
        current.map((item) => {
          if (item.id === image.id) {
            return { ...item, image_type: imageType };
          }

          if (
            imageType !== "gallery" &&
            item.product_id === image.product_id &&
            item.image_type === imageType
          ) {
            return { ...item, image_type: "gallery" };
          }

          return item;
        }),
      );
      setNotice(`Image set as ${imageType}.`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Image update failed.");
    }
  }

  async function deleteImage(image: ProductImage) {
    if (!supabase) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", image.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setImages((current) => current.filter((item) => item.id !== image.id));
    setNotice("Image removed.");

    if (editingId === image.id) {
      resetForm(image.product_id);
    }
  }

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    resetForm(productId);
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
            Product Images
          </h2>
        </div>
        <Button variant="outline" onClick={() => void loadImages()}>
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

      <Card>
        <CardHeader>
          <CardTitle>Select Product</CardTitle>
          <CardDescription>
            Manage image roles and order for one product at a time.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[minmax(260px,1fr)_repeat(4,140px)] lg:items-end">
          <div className="grid gap-2">
            <Label>Product</Label>
            <Select
              value={selectedProductId}
              onChange={(event) => handleProductChange(event.target.value)}
            >
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </div>
          {[
            ["Total", imageCounts.total],
            ["Main", imageCounts.main],
            ["Hover", imageCounts.hover],
            ["Gallery", imageCounts.gallery],
          ].map(([label, value]) => (
            <div key={label} className="rounded-md border border-neutral-200 p-3">
              <p className="text-xs font-black uppercase text-neutral-500">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black leading-none">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr] xl:items-start">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Image" : "Add Image"}</CardTitle>
            <CardDescription>
              Use public image URLs for now. Storage upload can come later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label>Product</Label>
                <Select
                  value={form.productId || selectedProductId}
                  onChange={(event) => updateForm("productId", event.target.value)}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Image URL</Label>
                <Input
                  value={form.imageUrl}
                  onChange={(event) => updateForm("imageUrl", event.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
              <div className="grid gap-2">
                <Label>Alt Text</Label>
                <Textarea
                  value={form.altText}
                  onChange={(event) => updateForm("altText", event.target.value)}
                  placeholder="Black Jacket 01 main image"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Image Type</Label>
                  <Select
                    value={form.imageType}
                    onChange={(event) =>
                      updateForm("imageType", event.target.value as ImageType)
                    }
                  >
                    <option value="main">main</option>
                    <option value="hover">hover</option>
                    <option value="gallery">gallery</option>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    min="1"
                    value={form.sortOrder}
                    onChange={(event) =>
                      updateForm("sortOrder", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="submit" disabled={isSaving}>
                  <ImagePlus className="size-4" aria-hidden="true" />
                  {isSaving ? "Saving" : editingId ? "Update" : "Add Image"}
                </Button>
                <Button variant="outline" onClick={() => resetForm()}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selectedProduct?.name ?? "Images"}</CardTitle>
            <CardDescription>
              One main and one hover image are kept per product. Gallery can
              contain multiple images.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 animate-pulse rounded-lg bg-neutral-100"
                  />
                ))}
              </div>
            ) : selectedImages.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {selectedImages.map((image) => (
                  <article
                    key={image.id}
                    className={cn(
                      "overflow-hidden rounded-lg border bg-white",
                      image.image_type === "main"
                        ? "border-black"
                        : "border-neutral-200",
                    )}
                  >
                    <div className="aspect-[4/3] bg-neutral-100">
                      <div
                        className="h-full w-full bg-cover bg-center grayscale"
                        style={{ backgroundImage: `url(${image.image_url})` }}
                      />
                    </div>
                    <div className="grid gap-4 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant={imageTypeVariant(image.image_type)}>
                          {image.image_type ?? "gallery"}
                        </Badge>
                        <span className="text-xs font-black uppercase text-neutral-500">
                          Sort {image.sort_order ?? 0}
                        </span>
                      </div>
                      <div>
                        <p className="line-clamp-2 text-sm font-black uppercase leading-5">
                          {image.alt_text || "No alt text"}
                        </p>
                        <p className="mt-2 line-clamp-1 break-all text-xs font-bold text-neutral-500">
                          {image.image_url}
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            size="sm"
                            variant={
                              image.image_type === "main" ? "default" : "outline"
                            }
                            onClick={() => void updateImageType(image, "main")}
                          >
                            <Star className="size-4" aria-hidden="true" />
                            Main
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              image.image_type === "hover" ? "default" : "outline"
                            }
                            onClick={() => void updateImageType(image, "hover")}
                          >
                            Hover
                          </Button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditing(image)}
                          >
                            <Edit3 className="size-4" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => void deleteImage(image)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-neutral-200 p-8 text-center">
                <p className="text-sm font-black uppercase text-neutral-500">
                  No images for this product yet.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
