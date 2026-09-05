import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantProducts, formatRupees } from '@/lib/merchant-data'
import { PageHeader } from '@/components/ui/PageHeader'
import { AddProductModal } from '@/components/dashboard/AddProductModal'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const { merchantId } = await getMerchantContext()
  const products = await getMerchantProducts(merchantId)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Products" subtitle="Manage your product inventory and pricing.">
        <AddProductModal />
      </PageHeader>
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Product Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Category</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Price</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Stock</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-3">
                      {product.imageUrl ? (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center flex-shrink-0 border border-slate-200">
                          <span className="text-slate-400 text-xs font-medium">No img</span>
                        </div>
                      )}
                      <span>{product.name}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{product.category || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 text-right">{formatRupees(product.pricePaise)}</td>
                    <td className="px-6 py-4 text-center">
                      {product.inventory > 0 ? (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border bg-slate-50 text-slate-600 border-slate-200/60">
                          {product.inventory} in stock
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border bg-red-50 text-red-700 border-red-200/60">
                          Out of stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border shadow-sm ${
                        product.active ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${product.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {product.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a href={`/dashboard/products/${product.id}/edit`} className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors">
                        Edit
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
