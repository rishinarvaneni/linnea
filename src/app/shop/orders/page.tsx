import { getCustomerOrders } from '@/lib/customer-orders'
import { OrderListClient } from '@/components/shop/OrderListClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function OrdersPage() {
  const orders = await getCustomerOrders()

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="text-slate-500 mt-1">View your order history and statuses.</p>
      </div>

      <OrderListClient orders={orders} />
    </div>
  )
}
