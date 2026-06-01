-- MVP backend hardening for Supabase.
-- Run this in the Supabase SQL editor after your base tables exist.
-- It adds:
-- 1. Admin helper policy function.
-- 2. Atomic checkout RPC with stock validation and stock decrement.
-- 3. Baseline RLS policies for storefront, account, cart, order, and admin flows.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.order_email_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz default now(),
  processed_at timestamptz
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.create_order_from_checkout(
  p_items jsonb,
  p_shipping_address jsonb,
  p_billing_address jsonb,
  p_shipping_method text default 'standard'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_profile_id uuid := auth.uid();
  v_customer_email text;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product_id uuid;
  v_size text;
  v_quantity integer;
  v_product record;
  v_variant record;
  v_line_total numeric := 0;
  v_subtotal numeric := 0;
  v_shipping_amount numeric := 0;
  v_tax_amount numeric := 0;
  v_discount_amount numeric := 0;
  v_total_amount numeric := 0;
begin
  if v_profile_id is null then
    raise exception 'Sign in before placing an order.';
  end if;

  if p_items is null
    or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty.';
  end if;

  if p_shipping_method not in ('standard', 'express', 'pickup') then
    raise exception 'Invalid shipping method.';
  end if;

  if p_shipping_method = 'express' then
    v_shipping_amount := 18;
  else
    v_shipping_amount := 0;
  end if;

  if coalesce(nullif(p_shipping_address ->> 'full_name', ''), '') = ''
    or coalesce(nullif(p_shipping_address ->> 'address_line_1', ''), '') = ''
    or coalesce(nullif(p_shipping_address ->> 'city', ''), '') = ''
    or coalesce(nullif(p_shipping_address ->> 'state', ''), '') = ''
    or coalesce(nullif(p_shipping_address ->> 'postal_code', ''), '') = ''
    or coalesce(nullif(p_shipping_address ->> 'country', ''), '') = '' then
    raise exception 'Shipping address is incomplete.';
  end if;

  select email
  into v_customer_email
  from public.profiles
  where id = v_profile_id;

  v_order_number :=
    'LOCAL-' ||
    to_char(clock_timestamp(), 'YYMMDDHH24MISS') ||
    '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));

  insert into public.orders (
    billing_address_snapshot,
    discount_amount,
    fulfillment_status,
    guest_email,
    order_number,
    payment_status,
    profile_id,
    shipping_address_snapshot,
    shipping_amount,
    status,
    subtotal,
    tax_amount,
    total_amount,
    updated_at
  )
  values (
    p_billing_address,
    v_discount_amount,
    'unfulfilled',
    v_customer_email,
    v_order_number,
    'unpaid',
    v_profile_id,
    p_shipping_address,
    v_shipping_amount,
    'pending',
    0,
    v_tax_amount,
    0,
    now()
  )
  returning id into v_order_id;

  for v_item in
    select value from jsonb_array_elements(p_items)
  loop
    begin
      v_product_id := (v_item ->> 'product_id')::uuid;
      v_size := nullif(btrim(v_item ->> 'size'), '');
      v_quantity := (v_item ->> 'quantity')::integer;
    exception when others then
      raise exception 'Invalid checkout item.';
    end;

    if v_size is null then
      raise exception 'Checkout item size is required.';
    end if;

    if v_quantity is null or v_quantity < 1 or v_quantity > 99 then
      raise exception 'Checkout quantity is invalid.';
    end if;

    select id, name, price
    into v_product
    from public.products
    where id = v_product_id
      and status = 'active';

    if not found then
      raise exception 'A product in your cart is no longer available.';
    end if;

    select id, sku, size, stock_quantity
    into v_variant
    from public.product_variants
    where product_id = v_product_id
      and size = v_size
      and is_active is distinct from false
    for update;

    if not found then
      raise exception '% size % is no longer available.', v_product.name, v_size;
    end if;

    if coalesce(v_variant.stock_quantity, 0) < v_quantity then
      raise exception '% size % has % left.',
        v_product.name,
        v_size,
        coalesce(v_variant.stock_quantity, 0);
    end if;

    update public.product_variants
    set stock_quantity = coalesce(stock_quantity, 0) - v_quantity,
        updated_at = now()
    where id = v_variant.id;

    v_line_total := v_product.price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (
      line_total,
      order_id,
      product_id,
      product_name_snapshot,
      quantity,
      size_snapshot,
      sku_snapshot,
      unit_price_snapshot,
      variant_id
    )
    values (
      v_line_total,
      v_order_id,
      v_product.id,
      v_product.name,
      v_quantity,
      v_variant.size,
      v_variant.sku,
      v_product.price,
      v_variant.id
    );
  end loop;

  v_total_amount :=
    greatest(v_subtotal + v_shipping_amount + v_tax_amount - v_discount_amount, 0);

  update public.orders
  set subtotal = v_subtotal,
      shipping_amount = v_shipping_amount,
      tax_amount = v_tax_amount,
      discount_amount = v_discount_amount,
      total_amount = v_total_amount,
      updated_at = now()
  where id = v_order_id;

  update public.carts
  set status = 'ordered',
      updated_at = now()
  where profile_id = v_profile_id
    and status = 'active';

  insert into public.order_email_notifications (order_id, status)
  values (v_order_id, 'pending');

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total_amount', v_total_amount,
    'notification_status', 'manual_follow_up_pending'
  );
end;
$$;

revoke execute on function public.create_order_from_checkout(jsonb, jsonb, jsonb, text) from anon;
grant execute on function public.create_order_from_checkout(jsonb, jsonb, jsonb, text) to authenticated;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.order_email_notifications enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
to anon, authenticated
using (is_active is distinct from false);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
to anon, authenticated
using (status = 'active');

drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active product images" on public.product_images;
create policy "Public can read active product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.status = 'active'
  )
);

drop policy if exists "Admins can manage product images" on public.product_images;
create policy "Admins can manage product images"
on public.product_images
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active product variants" on public.product_variants;
create policy "Public can read active product variants"
on public.product_variants
for select
to anon, authenticated
using (
  is_active is distinct from false
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.status = 'active'
  )
);

drop policy if exists "Admins can manage product variants" on public.product_variants;
create policy "Admins can manage product variants"
on public.product_variants
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can insert own customer profile" on public.profiles;
create policy "Users can insert own customer profile"
on public.profiles
for insert
to authenticated
with check (id = auth.uid() and role = 'customer');

drop policy if exists "Users can update own customer profile" on public.profiles;
create policy "Users can update own customer profile"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'customer');

drop policy if exists "Admins can manage profiles" on public.profiles;
create policy "Admins can manage profiles"
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can manage own addresses" on public.addresses;
create policy "Users can manage own addresses"
on public.addresses
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "Admins can read addresses" on public.addresses;
create policy "Admins can read addresses"
on public.addresses
for select
to authenticated
using (public.is_admin());

drop policy if exists "Users can manage own carts" on public.carts;
create policy "Users can manage own carts"
on public.carts
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "Users can manage own cart items" on public.cart_items;
create policy "Users can manage own cart items"
on public.cart_items
for all
to authenticated
using (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.carts
    where carts.id = cart_items.cart_id
      and carts.profile_id = auth.uid()
  )
);

drop policy if exists "Users can manage own wishlist" on public.wishlist_items;
create policy "Users can manage own wishlist"
on public.wishlist_items
for all
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
on public.orders
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "Admins can manage orders" on public.orders;
create policy "Admins can manage orders"
on public.orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own order items" on public.order_items;
create policy "Users can read own order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.profile_id = auth.uid()
  )
);

drop policy if exists "Admins can manage order items" on public.order_items;
create policy "Admins can manage order items"
on public.order_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can create contact messages" on public.contact_messages;
create policy "Public can create contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can manage contact messages" on public.contact_messages;
create policy "Admins can manage contact messages"
on public.contact_messages
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can create newsletter subscribers" on public.newsletter_subscribers;
create policy "Public can create newsletter subscribers"
on public.newsletter_subscribers
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can manage newsletter subscribers" on public.newsletter_subscribers;
create policy "Admins can manage newsletter subscribers"
on public.newsletter_subscribers
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can manage order email notifications" on public.order_email_notifications;
create policy "Admins can manage order email notifications"
on public.order_email_notifications
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
