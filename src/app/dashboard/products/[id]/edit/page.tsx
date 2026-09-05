import { getMerchantContext } from '@/lib/merchant-context'
import { db as prisma } from '@/lib/db'
import { PageHeader } from '@/components/ui/PageHeader'
import { EditProductForm } from '@/components/dashboard/EditProductForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { merchantId } = await getMerchantContext()
  
  const product = await prisma.product.findFirst({
    where: { 
      id: params.id,
      merchantId: merchantId
    }
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <PageHeader 
        title="Edit Product" 
        subtitle="Update details, pricing, and inventory for this product."
      />
      
      <EditProductForm product={product} />
    </div>
  )
}
