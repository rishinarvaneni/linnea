import { getStoreContext } from '@/lib/store-context'
import { db as prisma } from '@/lib/db'
import { StorefrontClient } from './StorefrontClient'
import { CartDrawer } from '@/components/ui/CartDrawer'
import { fetchCustomerCart } from '@/app/actions/cart'

export const dynamic = 'force-dynamic'

export default async function StorefrontPage() {
  const storeContext = await getStoreContext()
  const merchantId = storeContext.merchantId

  const cart = await fetchCustomerCart()

  const products = await prisma.product.findMany({
    where: { merchantId },
    orderBy: { createdAt: 'desc' }
  })

  // Transform products into ProductView for the client component
  const productViews = products.map(p => ({
    id: p.id,
    name: p.name,
    description: p.description ?? undefined,
    pricePaise: p.pricePaise,
    inventory: p.inventory,
    category: p.category ?? undefined,
    imageUrl: p.imageUrl ?? undefined
  }))

  return (
    <div className="flex h-full bg-white flex-col">
      {/* Header Area */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0 sticky top-0 z-50">
        <div>
          <h1 className="font-semibold text-slate-900">Store</h1>
        </div>
        <div>
          <CartDrawer cart={cart} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {products.length > 0 ? (
          <StorefrontClient products={productViews} />
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <span className="text-2xl">🛍️</span>
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">No products available</h3>
            <p className="text-slate-500">The merchant hasn't added any products to their store yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
