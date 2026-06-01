import { AdminOrderDetailView } from "@/components/admin/AdminOrderDetailView";

type AdminOrderDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminOrderDetailPage({
  params,
}: AdminOrderDetailPageProps) {
  const { id } = await params;

  return <AdminOrderDetailView orderId={id} />;
}
