'use server'

import { getMerchantContext } from '@/lib/merchant-context'
import { db as prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { writeFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function addProduct(formData: FormData) {
  try {
    const { merchantId } = await getMerchantContext()
    if (!merchantId) throw new Error("Unauthorized")

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const priceStr = formData.get('price') as string
    const stockStr = formData.get('stock') as string
    const imageFile = formData.get('image') as File | null

    if (!name || !priceStr || !stockStr) {
      throw new Error("Missing required fields")
    }

    const pricePaise = Math.round(parseFloat(priceStr) * 100)
    const inventory = parseInt(stockStr, 10)

    if (isNaN(pricePaise) || pricePaise < 0) {
      throw new Error("Invalid price")
    }
    
    if (isNaN(inventory) || inventory < 0) {
      throw new Error("Invalid stock quantity")
    }

    let imageUrl = null

    if (imageFile && imageFile.size > 0) {
      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        throw new Error("Uploaded file is not an image")
      }
      
      // Limit to 5MB
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error("Image size must be less than 5MB")
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const fileExt = imageFile.name.split('.').pop() || 'png'
      const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}.${fileExt}`
      
      // Save locally to public/uploads/products/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
      const filePath = path.join(uploadDir, uniqueFileName)
      
      await writeFile(filePath, buffer)
      
      imageUrl = `/uploads/products/${uniqueFileName}`
    }

    const product = await prisma.product.create({
      data: {
        merchantId,
        name,
        description: description || null,
        category: category || null,
        pricePaise,
        inventory,
        imageUrl,
        active: true
      }
    })

    revalidatePath('/dashboard/products')
    revalidatePath('/shop/home')
    
    return { success: true, product }
  } catch (error: any) {
    console.error('Add product error:', error)
    return { success: false, error: error.message || 'Failed to add product' }
  }
}

export async function editProduct(productId: string, formData: FormData) {
  try {
    const { merchantId } = await getMerchantContext()
    if (!merchantId) throw new Error("Unauthorized")

    // Verify ownership
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    })
    
    if (!existingProduct || existingProduct.merchantId !== merchantId) {
      throw new Error("Product not found or unauthorized")
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const priceStr = formData.get('price') as string
    const stockStr = formData.get('stock') as string
    const activeStr = formData.get('active') as string
    const imageFile = formData.get('image') as File | null

    if (!name || !priceStr || !stockStr) {
      throw new Error("Missing required fields")
    }

    const pricePaise = Math.round(parseFloat(priceStr) * 100)
    const inventory = parseInt(stockStr, 10)
    const active = activeStr === 'true'

    if (isNaN(pricePaise) || pricePaise < 0) {
      throw new Error("Invalid price")
    }
    
    if (isNaN(inventory) || inventory < 0) {
      throw new Error("Invalid stock quantity")
    }

    let imageUrl = existingProduct.imageUrl

    if (imageFile && imageFile.size > 0) {
      // Validate file type
      if (!imageFile.type.startsWith('image/')) {
        throw new Error("Uploaded file is not an image")
      }
      
      // Limit to 5MB
      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error("Image size must be less than 5MB")
      }

      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const fileExt = imageFile.name.split('.').pop() || 'png'
      const uniqueFileName = `${crypto.randomBytes(16).toString('hex')}.${fileExt}`
      
      // Save locally to public/uploads/products/
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products')
      const filePath = path.join(uploadDir, uniqueFileName)
      
      await writeFile(filePath, buffer)
      
      imageUrl = `/uploads/products/${uniqueFileName}`
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name,
        description: description || null,
        category: category || null,
        pricePaise,
        inventory,
        imageUrl,
        active
      }
    })

    revalidatePath('/dashboard/products')
    revalidatePath(`/dashboard/products/${productId}/edit`)
    revalidatePath('/shop/home')
    revalidatePath('/shop')
    
    return { success: true, product }
  } catch (error: any) {
    console.error('Edit product error:', error)
    return { success: false, error: error.message || 'Failed to update product' }
  }
}

