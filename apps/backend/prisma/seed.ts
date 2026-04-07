import {
  PrismaClient,
  OnboardingStatus,
  IngredientUnit,
  PaymentProvider,
  SubscriptionPlan,
  SubscriptionStatus,
  ExpenseCategory,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding PARCE database...')

  // ─── Restaurante Demo ────────────────────────────────────────────────
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'demo-pizzeria' },
    update: {},
    create: {
      slug: 'demo-pizzeria',
      name: 'Pizza Buena Nota',
      phone: '+57 300 123 4567',
      address: 'Calle 10 # 5-23, Barrio La Candelaria, Bogotá',
      paymentProvider: PaymentProvider.WOMPI,
      isActive: true,
      isOpen: true,
      onboardingStatus: OnboardingStatus.COMPLETED,
      timezone: 'America/Bogota',
      openHours: {
        monday:    { open: '11:00', close: '22:00' },
        tuesday:   { open: '11:00', close: '22:00' },
        wednesday: { open: '11:00', close: '22:00' },
        thursday:  { open: '11:00', close: '22:00' },
        friday:    { open: '11:00', close: '23:00' },
        saturday:  { open: '12:00', close: '23:00' },
        sunday:    { open: '12:00', close: '21:00' },
      },
    },
  })

  // ─── Usuario dueño ───────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo1234!', 10)
  await prisma.user.upsert({
    where: { email: 'demo@parce.app' },
    update: {},
    create: {
      email: 'demo@parce.app',
      passwordHash,
      name: 'Carlos Demo',
      restaurantId: restaurant.id,
      role: 'OWNER',
    },
  })

  // ─── Plan trial activo ───────────────────────────────────────────────
  await prisma.restaurantPlan.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.TRIAL,
      trialEndsAt: addDays(new Date(), 30),
    },
  })

  // ─── Categorías del menú ─────────────────────────────────────────────
  const catPizzas = await prisma.menuCategory.upsert({
    where: { id: 'cat-pizzas-demo' },
    update: {},
    create: {
      id: 'cat-pizzas-demo',
      restaurantId: restaurant.id,
      name: 'Pizzas',
      position: 1,
    },
  })

  const catBebidas = await prisma.menuCategory.upsert({
    where: { id: 'cat-bebidas-demo' },
    update: {},
    create: {
      id: 'cat-bebidas-demo',
      restaurantId: restaurant.id,
      name: 'Bebidas',
      position: 2,
    },
  })

  const catExtras = await prisma.menuCategory.upsert({
    where: { id: 'cat-extras-demo' },
    update: {},
    create: {
      id: 'cat-extras-demo',
      restaurantId: restaurant.id,
      name: 'Extras',
      position: 3,
    },
  })

  // ─── Items del menú ──────────────────────────────────────────────────
  const pizzaMargarita = await prisma.menuItem.upsert({
    where: { id: 'item-margarita-demo' },
    update: {},
    create: {
      id: 'item-margarita-demo',
      restaurantId: restaurant.id,
      categoryId: catPizzas.id,
      name: 'Pizza Margarita',
      description: 'Salsa de tomate, mozzarella y albahaca fresca',
      price: 22000,
      isAvailable: true,
      position: 1,
    },
  })

  const pizzaPepperoni = await prisma.menuItem.upsert({
    where: { id: 'item-pepperoni-demo' },
    update: {},
    create: {
      id: 'item-pepperoni-demo',
      restaurantId: restaurant.id,
      categoryId: catPizzas.id,
      name: 'Pizza Pepperoni',
      description: 'Salsa de tomate, mozzarella y pepperoni',
      price: 26000,
      isAvailable: true,
      position: 2,
    },
  })

  const pizzaHawaiana = await prisma.menuItem.upsert({
    where: { id: 'item-hawaiana-demo' },
    update: {},
    create: {
      id: 'item-hawaiana-demo',
      restaurantId: restaurant.id,
      categoryId: catPizzas.id,
      name: 'Pizza Hawaiana',
      description: 'Salsa de tomate, mozzarella, jamón y piña',
      price: 24000,
      isAvailable: true,
      position: 3,
    },
  })

  await prisma.menuItem.upsert({
    where: { id: 'item-coca-demo' },
    update: {},
    create: {
      id: 'item-coca-demo',
      restaurantId: restaurant.id,
      categoryId: catBebidas.id,
      name: 'Coca-Cola 350ml',
      description: 'Bebida refrescante',
      price: 4000,
      isAvailable: true,
      position: 1,
    },
  })

  await prisma.menuItem.upsert({
    where: { id: 'item-agua-demo' },
    update: {},
    create: {
      id: 'item-agua-demo',
      restaurantId: restaurant.id,
      categoryId: catBebidas.id,
      name: 'Agua 500ml',
      description: 'Agua mineral',
      price: 2500,
      isAvailable: true,
      position: 2,
    },
  })

  await prisma.menuItem.upsert({
    where: { id: 'item-extra-queso-demo' },
    update: {},
    create: {
      id: 'item-extra-queso-demo',
      restaurantId: restaurant.id,
      categoryId: catExtras.id,
      name: 'Extra Mozzarella',
      description: 'Porción adicional de queso mozzarella',
      price: 3500,
      isAvailable: true,
      position: 1,
    },
  })

  // ─── Ingredientes ────────────────────────────────────────────────────
  const harina = await prisma.ingredient.upsert({
    where: { id: 'ing-harina-demo' },
    update: {},
    create: {
      id: 'ing-harina-demo',
      restaurantId: restaurant.id,
      name: 'Harina de trigo',
      unit: IngredientUnit.KG,
      stock: 15,
      minStock: 5,
      costPerUnit: 4200,
    },
  })

  const mozzarella = await prisma.ingredient.upsert({
    where: { id: 'ing-mozz-demo' },
    update: {},
    create: {
      id: 'ing-mozz-demo',
      restaurantId: restaurant.id,
      name: 'Queso mozzarella',
      unit: IngredientUnit.KG,
      stock: 4,
      minStock: 2,
      costPerUnit: 18000,
    },
  })

  const salsaTomate = await prisma.ingredient.upsert({
    where: { id: 'ing-salsa-demo' },
    update: {},
    create: {
      id: 'ing-salsa-demo',
      restaurantId: restaurant.id,
      name: 'Salsa de tomate',
      unit: IngredientUnit.L,
      stock: 3,
      minStock: 1,
      costPerUnit: 6500,
    },
  })

  const pepperoni = await prisma.ingredient.upsert({
    where: { id: 'ing-pepp-demo' },
    update: {},
    create: {
      id: 'ing-pepp-demo',
      restaurantId: restaurant.id,
      name: 'Pepperoni',
      unit: IngredientUnit.KG,
      stock: 2,
      minStock: 0.5,
      costPerUnit: 28000,
    },
  })

  const jamon = await prisma.ingredient.upsert({
    where: { id: 'ing-jamon-demo' },
    update: {},
    create: {
      id: 'ing-jamon-demo',
      restaurantId: restaurant.id,
      name: 'Jamón',
      unit: IngredientUnit.KG,
      stock: 1.5,
      minStock: 0.5,
      costPerUnit: 22000,
    },
  })

  const pina = await prisma.ingredient.upsert({
    where: { id: 'ing-pina-demo' },
    update: {},
    create: {
      id: 'ing-pina-demo',
      restaurantId: restaurant.id,
      name: 'Piña en conserva',
      unit: IngredientUnit.KG,
      stock: 2,
      minStock: 0.5,
      costPerUnit: 8000,
    },
  })

  const albahaca = await prisma.ingredient.upsert({
    where: { id: 'ing-albahaca-demo' },
    update: {},
    create: {
      id: 'ing-albahaca-demo',
      restaurantId: restaurant.id,
      name: 'Albahaca fresca',
      unit: IngredientUnit.G,
      stock: 200,
      minStock: 50,
      costPerUnit: 80, // costo por gramo
    },
  })

  const aceite = await prisma.ingredient.upsert({
    where: { id: 'ing-aceite-demo' },
    update: {},
    create: {
      id: 'ing-aceite-demo',
      restaurantId: restaurant.id,
      name: 'Aceite de oliva',
      unit: IngredientUnit.ML,
      stock: 2000,
      minStock: 500,
      costPerUnit: 22, // costo por ml
    },
  })

  // ─── Recetas ─────────────────────────────────────────────────────────
  // Receta Pizza Margarita (base para pizza de 30cm)
  await prisma.recipe.upsert({
    where: { menuItemId: pizzaMargarita.id },
    update: {},
    create: {
      menuItemId: pizzaMargarita.id,
      name: 'Pizza Margarita 30cm',
      recipeItems: {
        create: [
          { ingredientId: harina.id, quantity: 0.35 },      // 350g de harina
          { ingredientId: mozzarella.id, quantity: 0.20 },  // 200g de mozz
          { ingredientId: salsaTomate.id, quantity: 0.08 }, // 80ml de salsa
          { ingredientId: albahaca.id, quantity: 5 },       // 5g de albahaca
          { ingredientId: aceite.id, quantity: 15 },        // 15ml aceite
        ],
      },
    },
  })

  // Receta Pizza Pepperoni
  await prisma.recipe.upsert({
    where: { menuItemId: pizzaPepperoni.id },
    update: {},
    create: {
      menuItemId: pizzaPepperoni.id,
      name: 'Pizza Pepperoni 30cm',
      recipeItems: {
        create: [
          { ingredientId: harina.id, quantity: 0.35 },
          { ingredientId: mozzarella.id, quantity: 0.22 },
          { ingredientId: salsaTomate.id, quantity: 0.08 },
          { ingredientId: pepperoni.id, quantity: 0.12 },
          { ingredientId: aceite.id, quantity: 15 },
        ],
      },
    },
  })

  // Receta Pizza Hawaiana
  await prisma.recipe.upsert({
    where: { menuItemId: pizzaHawaiana.id },
    update: {},
    create: {
      menuItemId: pizzaHawaiana.id,
      name: 'Pizza Hawaiana 30cm',
      recipeItems: {
        create: [
          { ingredientId: harina.id, quantity: 0.35 },
          { ingredientId: mozzarella.id, quantity: 0.18 },
          { ingredientId: salsaTomate.id, quantity: 0.08 },
          { ingredientId: jamon.id, quantity: 0.10 },
          { ingredientId: pina.id, quantity: 0.08 },
          { ingredientId: aceite.id, quantity: 15 },
        ],
      },
    },
  })

  // ─── Secuencia de pedidos ────────────────────────────────────────────
  await prisma.restaurantOrderSequence.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      lastOrderNumber: 0,
    },
  })

  // ─── Onboarding session (completada) ─────────────────────────────────
  await prisma.aiOnboardingSession.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      currentStep: 'COMPLETE',
      completedAt: new Date(),
      messages: [
        {
          role: 'assistant',
          content:
            'Hola parce! Soy Parce IA, tu copiloto. Vamos a configurar las recetas de tu restaurante para que pueda ayudarte a controlar el inventario automáticamente. Listo?',
        },
        { role: 'user', content: 'Listo, arranquemos' },
        {
          role: 'assistant',
          content:
            'Perfecto. Ya veo que tienes 6 productos en tu menú. Empecemos con la Pizza Margarita. Qué ingredientes necesitas para prepararla?',
        },
      ],
    },
  })

  // ─── Gastos de ejemplo ───────────────────────────────────────────────
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  await prisma.expense.createMany({
    skipDuplicates: true,
    data: [
      {
        restaurantId: restaurant.id,
        amount: 850000,
        category: ExpenseCategory.RENT,
        description: 'Arriendo del local',
        rawInput: 'Pague el arriendo 850 mil',
        date: new Date(today.getFullYear(), today.getMonth(), 1),
      },
      {
        restaurantId: restaurant.id,
        amount: 120000,
        category: ExpenseCategory.UTILITIES,
        description: 'Factura de gas',
        rawInput: 'Gas del mes 120 mil',
        date: yesterday,
      },
      {
        restaurantId: restaurant.id,
        amount: 280000,
        category: ExpenseCategory.INGREDIENTS,
        description: 'Compra de ingredientes (harina, queso)',
        rawInput: 'Compre harina y queso 280 mil',
        date: yesterday,
      },
    ],
  })

  console.log('Seed completado exitosamente')
  console.log(
    [
      '',
      'Datos creados:',
      `  Restaurante:  ${restaurant.name} (slug: ${restaurant.slug})`,
      '  Usuario:      demo@parce.app / Demo1234!',
      '  Plan:         PRO Trial (30 dias)',
      '  Categorias:   Pizzas, Bebidas, Extras',
      '  Productos:    6 items en el menu',
      '  Ingredientes: 8 ingredientes con stock',
      '  Recetas:      3 recetas completas (Margarita, Pepperoni, Hawaiana)',
    ].join('\n'),
  )
}

main()
  .catch((e) => {
    console.error('Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
