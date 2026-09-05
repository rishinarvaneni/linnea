import { db as prisma } from '../src/lib/db';

async function seedCatalog() {
  console.log('Fetching active merchant...');
  const merchant = await prisma.merchant.findFirst();
  if (!merchant) {
    throw new Error('No merchant found. Cannot seed catalog.');
  }
  const merchantId = merchant.id;

  console.log(`Auditing existing products for Merchant: ${merchant.businessName} (${merchantId})`);
  
  // Clean up any test/adversarial products safely
  const allProducts = await prisma.product.findMany({ where: { merchantId } });
  
  for (const product of allProducts) {
    if (/test|qa|adversarial/i.test(product.name)) {
      const orderItemCount = await prisma.orderItem.count({ where: { productId: product.id } });
      const cartItemCount = await prisma.cartItem.count({ where: { productId: product.id } });
      
      if (orderItemCount > 0 || cartItemCount > 0) {
        console.log(`Disabling test product (has history): ${product.name}`);
        await prisma.product.update({ where: { id: product.id }, data: { active: false } });
      } else {
        console.log(`Deleting test product (no history): ${product.name}`);
        await prisma.product.delete({ where: { id: product.id } });
      }
    }
  }

  const catalog = [
    // Existing Products Enhanced
    {
      name: 'Noise Cancelling Headphones',
      description: 'Over-ear premium wireless headphones featuring active noise cancellation, 30-hour battery life, and high-fidelity audio for immersive listening.',
      category: 'Audio',
      pricePaise: 299900, // Preserve original or set realistic
      inventory: 15,
      imageUrl: '/uploads/products/product_headphones.jpg',
      active: true,
    },
    {
      name: 'Bluetooth Speakers',
      description: 'Portable waterproof Bluetooth speakers delivering 360-degree deep bass. Perfect for outdoor gatherings or home audio setups.',
      category: 'Audio',
      pricePaise: 499900,
      inventory: 24,
      imageUrl: '/uploads/products/product_speakers.jpg',
      active: true,
    },
    {
      name: 'Ceramic Kaari Vase',
      description: 'Handcrafted ceramic vase with a minimalist ribbed design. Ideal for dried flowers or as a standalone centerpiece.',
      category: 'Home Decor',
      pricePaise: 150000,
      inventory: 12,
      imageUrl: '/uploads/products/product_vase.jpg',
      active: true,
    },
    {
      name: 'Nordic Table Lamp',
      description: 'Sleek Nordic-inspired floor lamp with adjustable warm LED lighting. Designed to add ambient warmth to living rooms or bedrooms.',
      category: 'Lighting',
      pricePaise: 459900,
      inventory: 8,
      imageUrl: '/uploads/products/product_lamp.jpg',
      active: true,
    },
    {
      name: 'Lavender Scented Candle',
      description: 'Hand-poured natural soy wax candle infused with calming lavender essential oils. Burns cleanly for up to 45 hours.',
      category: 'Candles',
      pricePaise: 89900,
      inventory: 45,
      imageUrl: '/uploads/products/product_candle.jpg',
      active: true,
    },
    {
      name: 'Minimalist Smart Watch',
      description: 'A sleek minimalist smart watch featuring a black silicone band, heart rate monitoring, fitness tracking, and push notifications.',
      category: 'Electronics',
      pricePaise: 899900,
      inventory: 18,
      imageUrl: '/uploads/products/product_watch.jpg',
      active: true,
    },
    {
      name: 'Ergonomic Office Chair',
      description: 'Modern ergonomic mesh office chair in black and grey. Features dynamic lower back support and adjustable armrests for long working hours.',
      category: 'Furniture',
      pricePaise: 1250000,
      inventory: 5,
      imageUrl: '/uploads/products/product_chair.jpg',
      active: true,
    },
    // New Products
    {
      name: 'Mechanical Gaming Keyboard',
      description: 'Tactile mechanical keyboard with customizable RGB backlighting and durable switches. Engineered for competitive gaming and fast typing.',
      category: 'Gaming',
      pricePaise: 499900,
      inventory: 22,
      imageUrl: '/uploads/products/product_keyboard.jpg',
      active: true,
    },
    {
      name: 'Wireless Gaming Mouse',
      description: 'Ergonomic wireless gaming mouse with a high-precision optical sensor and programmable side buttons for zero-latency gameplay.',
      category: 'Gaming',
      pricePaise: 349900,
      inventory: 30,
      imageUrl: '/uploads/products/product_mouse.jpg',
      active: true,
    },
    {
      name: 'Smart Desk Lamp',
      description: 'App-controlled smart desk lamp featuring tunable color temperatures and brightness levels to reduce eye strain during late-night work.',
      category: 'Lighting',
      pricePaise: 249900,
      inventory: 14,
      imageUrl: '/uploads/products/product_desk_lamp.jpg',
      active: true,
    },
    {
      name: 'Premium Aroma Diffuser',
      description: 'Ultrasonic ceramic aroma diffuser that humidifies the air while dispersing your favorite essential oils. Features a subtle ambient LED glow.',
      category: 'Home Decor',
      pricePaise: 199900,
      inventory: 25,
      imageUrl: '/uploads/products/product_diffuser.jpg',
      active: true,
    },
    {
      name: 'Minimalist Desk Organizer',
      description: 'A multi-compartment bamboo desk organizer designed to keep pens, notebooks, and small gadgets neatly arranged on your workspace.',
      category: 'Desk Accessories',
      pricePaise: 129900,
      inventory: 40,
      imageUrl: '/uploads/products/product_organizer.jpg',
      active: true,
    },
    {
      name: 'LED Monitor Light',
      description: 'Screen-glare-free monitor light bar that mounts securely to the top of your display, illuminating your desk area efficiently.',
      category: 'Lighting',
      pricePaise: 299900,
      inventory: 10,
      imageUrl: '/uploads/products/product_monitor_light.jpg',
      active: true,
    },
    {
      name: 'Wireless Charging Stand',
      description: 'Sleek fast-charging stand compatible with Qi-enabled smartphones and earbuds. Allows vertical or horizontal phone placement.',
      category: 'Electronics',
      pricePaise: 179900,
      inventory: 35,
      imageUrl: '/uploads/products/product_charging_stand.jpg',
      active: true,
    },
    {
      name: 'Smart Ambient Light',
      description: 'Modular ambient light bars that sync with your monitor or music to create dynamic, immersive lighting effects in your room.',
      category: 'Lighting',
      pricePaise: 399900,
      inventory: 16,
      imageUrl: '/uploads/products/product_ambient_light.jpg',
      active: true,
    },
    {
      name: 'Ergonomic Mouse Pad',
      description: 'Extended gaming mouse pad with a micro-woven cloth surface and anti-slip rubber base. Optimized for both low and high DPI tracking.',
      category: 'Desk Accessories',
      pricePaise: 99900,
      inventory: 50,
      imageUrl: '/uploads/products/product_keyboard.jpg',
      active: true,
    },
    {
      name: 'Studio Condenser Microphone',
      description: 'Professional USB condenser microphone with a cardioid polar pattern. Ideal for podcasting, streaming, and vocal recording.',
      category: 'Audio',
      pricePaise: 899900,
      inventory: 7,
      imageUrl: '/uploads/products/product_speakers.jpg',
      active: true,
    }
  ];

  console.log(`Seeding catalog with ${catalog.length} products...`);
  
  for (const item of catalog) {
    const existingProduct = await prisma.product.findFirst({
      where: { merchantId, name: item.name }
    });

    if (existingProduct) {
      console.log(`Updating existing product: ${item.name}`);
      await prisma.product.update({
        where: { id: existingProduct.id },
        data: {
          description: item.description,
          imageUrl: item.imageUrl,
          category: item.category,
          active: item.active
          // Specifically NOT updating pricePaise and inventory to preserve transaction safety 
          // unless explicitly intended, but we are enriching them.
        }
      });
    } else {
      console.log(`Creating new product: ${item.name}`);
      await prisma.product.create({
        data: {
          merchantId,
          ...item
        }
      });
    }
  }

  console.log('Seed completed successfully.');
}

seedCatalog().catch(console.error).finally(() => process.exit(0));
