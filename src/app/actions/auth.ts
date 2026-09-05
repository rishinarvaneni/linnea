'use server'

import { db } from '@/lib/db'
import { createSession, destroySession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const registerSchema = z.object({
  role: z.enum(['MERCHANT', 'CUSTOMER']),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
  businessName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const loginSchema = z.object({
  role: z.enum(['MERCHANT', 'CUSTOMER']),
  email: z.string().email(),
  password: z.string(),
})

export async function register(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    
    // Server-side validation
    const parsed = registerSchema.safeParse(rawData)
    
    if (!parsed.success) {
      throw new Error('Invalid input. Please check your fields.')
    }
    
    const { role, email, password, businessName, firstName, lastName } = parsed.data

    if (role === 'MERCHANT' && !businessName) {
      throw new Error('Business name is required for merchants.')
    }
    
    if (role === 'CUSTOMER' && (!firstName || !lastName)) {
      throw new Error('First and last name are required for customers.')
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new Error('Email already exists.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        ...(role === 'MERCHANT' 
          ? { merchant: { create: { businessName: businessName as string } } }
          : { customer: { create: { firstName: firstName as string, lastName: lastName as string } } }
        )
      },
    })

    await createSession(user.id, user.role)
  } catch (error: any) {
    console.error('Registration error', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred.')
  }

  // Redirect happens outside try-catch to allow Next.js throw redirect to bubble up
  const role = formData.get('role')
  redirect(role === 'MERCHANT' ? '/dashboard' : '/shop')
}

export async function login(formData: FormData) {
  try {
    const rawData = Object.fromEntries(formData.entries())
    const parsed = loginSchema.safeParse(rawData)

    if (!parsed.success) {
      throw new Error('Invalid input.')
    }

    const { role, email, password } = parsed.data

    const user = await db.user.findUnique({
      where: { email },
    })

    if (!user || user.role !== role) {
      throw new Error('Invalid credentials or role.')
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      throw new Error('Invalid credentials or role.')
    }

    await createSession(user.id, user.role)
  } catch (error: any) {
    console.error('Login error', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred.')
  }

  const role = formData.get('role')
  redirect(role === 'MERCHANT' ? '/dashboard' : '/shop')
}

export async function logout() {
  await destroySession()
  redirect('/')
}
