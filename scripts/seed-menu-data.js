// scripts/seed-menu-data.js
// Populates the database with sample menu content (allergens, dietary tags,
// courses, categories, menu items and set menus) with EN/ES translations.
// All operations are idempotent — safe to re-run without duplicating data.
//
// Usage: node scripts/seed-menu-data.js

require('dotenv').config();
const prisma = require('../src/config/database');

// ── Find-or-create helpers ──────────────────────────────────────────────────

async function findOrCreateAllergen(en, es) {
  const existing = await prisma.allergenTag.findFirst({
    where: { translations: { some: { lang: 'en', name: en } } },
  });
  if (existing) return existing;
  return prisma.allergenTag.create({
    data: {
      translations: { create: [{ lang: 'en', name: en }, { lang: 'es', name: es }] },
    },
  });
}

async function findOrCreateDietary(en, es) {
  const existing = await prisma.dietaryTag.findFirst({
    where: { translations: { some: { lang: 'en', name: en } } },
  });
  if (existing) return existing;
  return prisma.dietaryTag.create({
    data: {
      translations: { create: [{ lang: 'en', name: en }, { lang: 'es', name: es }] },
    },
  });
}

async function findOrCreateCourse(en, es, display_order) {
  const existing = await prisma.course.findFirst({
    where: { translations: { some: { lang: 'en', name: en } } },
  });
  if (existing) return existing;
  return prisma.course.create({
    data: {
      display_order,
      translations: { create: [{ lang: 'en', name: en }, { lang: 'es', name: es }] },
    },
  });
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding menu data...\n');

  // ── 1. ALLERGEN TAGS (14 EU mandatory) ──────────────────────────────────
  console.log('→ Allergen tags');
  const A = {};
  for (const [en, es] of [
    ['Gluten',      'Gluten'],
    ['Crustaceans', 'Crustáceos'],
    ['Eggs',        'Huevos'],
    ['Fish',        'Pescado'],
    ['Peanuts',     'Cacahuetes'],
    ['Soya',        'Soja'],
    ['Milk',        'Leche'],
    ['Tree Nuts',   'Frutos de Cáscara'],
    ['Celery',      'Apio'],
    ['Mustard',     'Mostaza'],
    ['Sesame',      'Sésamo'],
    ['Sulphites',   'Sulfitos'],
    ['Lupin',       'Altramuz'],
    ['Molluscs',    'Moluscos'],
  ]) {
    const tag = await findOrCreateAllergen(en, es);
    A[en] = tag.id;
  }
  console.log(`   ${Object.keys(A).length} ready`);

  // ── 2. DIETARY TAGS ──────────────────────────────────────────────────────
  console.log('→ Dietary tags');
  const D = {};
  for (const [en, es] of [
    ['Vegetarian', 'Vegetariano'],
    ['Vegan',      'Vegano'],
    ['Gluten Free','Sin Gluten'],
    ['Dairy Free', 'Sin Lácteos'],
    ['Spicy',      'Picante'],
    ['Organic',    'Ecológico'],
  ]) {
    const tag = await findOrCreateDietary(en, es);
    D[en] = tag.id;
  }
  console.log(`   ${Object.keys(D).length} ready`);

  // ── 3. COURSES ───────────────────────────────────────────────────────────
  console.log('→ Courses');
  const C = {};
  for (const [en, es, order] of [
    ['Starter',     'Entrante',        1],
    ['Main Course', 'Plato Principal', 2],
    ['Side Dish',   'Guarnición',      3],
    ['Dessert',     'Postre',          4],
  ]) {
    const course = await findOrCreateCourse(en, es, order);
    C[en] = course.id;
  }
  console.log(`   ${Object.keys(C).length} ready`);

  // ── 4. CATEGORIES ────────────────────────────────────────────────────────
  console.log('→ Categories');

  const upsertCat = (slug, data) =>
    prisma.category.upsert({ where: { slug }, update: {}, create: { slug, ...data } });

  const catTr = (nameEn, nameEs, descEn, descEs) => ({
    translations: {
      create: [
        { lang: 'en', name: nameEn, description: descEn },
        { lang: 'es', name: nameEs, description: descEs },
      ],
    },
  });

  // Top-level (protected system categories first)
  const catSetMenus = await upsertCat('set-menus', {
    display_order: 1, is_protected: true,
    ...catTr('Set Menus', 'Menús',
      'Our carefully curated set menus',
      'Nuestros menús cuidadosamente elaborados'),
  });

  const catSpecials = await upsertCat('chefs-specials', {
    display_order: 2, is_protected: true,
    ...catTr("Chef's Specials", 'Especiales del Chef',
      'Seasonal dishes personally selected by our chef',
      'Platos de temporada elegidos personalmente por nuestro chef'),
  });

  const catStarters = await upsertCat('starters', {
    display_order: 3,
    ...catTr('Starters & Tapas', 'Entrantes y Tapas',
      'Small plates and starters to share',
      'Platos pequeños y entrantes para compartir'),
  });

  const catFish = await upsertCat('fish-seafood', {
    display_order: 4,
    ...catTr('Fish & Seafood', 'Pescados y Mariscos',
      'The freshest catch from the Atlantic coast',
      'El pescado más fresco de la costa atlántica'),
  });

  const catMeat = await upsertCat('meat-poultry', {
    display_order: 5,
    ...catTr('Meat & Poultry', 'Carnes y Aves',
      'Grilled and slow-cooked meats',
      'Carnes a la brasa y a fuego lento'),
  });

  const catVeg = await upsertCat('vegetarian-vegan', {
    display_order: 6,
    ...catTr('Vegetarian & Vegan', 'Vegetariano y Vegano',
      'Plant-based dishes full of flavour',
      'Platos de origen vegetal llenos de sabor'),
  });

  const catDesserts = await upsertCat('desserts', {
    display_order: 7,
    ...catTr('Desserts', 'Postres',
      'Sweet endings to your meal',
      'El dulce final de tu comida'),
  });

  const catDrinks = await upsertCat('drinks', {
    display_order: 8,
    ...catTr('Drinks', 'Bebidas',
      'Wine, cocktails and soft drinks',
      'Vinos, cócteles y refrescos'),
  });

  // Sub-categories: Fish & Seafood
  await upsertCat('fresh-fish', {
    parent_id: catFish.id, display_order: 1,
    ...catTr('Fresh Fish', 'Pescado Fresco',
      'Whole fish and fillets cooked to order',
      'Pescado entero y filetes cocinados al momento'),
  });

  await upsertCat('shellfish', {
    parent_id: catFish.id, display_order: 2,
    ...catTr('Shellfish & Crustaceans', 'Mariscos y Crustáceos',
      'Prawns, lobster, clams and more',
      'Gambas, langosta, almejas y más'),
  });

  // Sub-categories: Drinks
  await upsertCat('wines', {
    parent_id: catDrinks.id, display_order: 1,
    ...catTr('Wines', 'Vinos',
      'Spanish and international wines',
      'Vinos españoles e internacionales'),
  });

  await upsertCat('spirits-cocktails', {
    parent_id: catDrinks.id, display_order: 2,
    ...catTr('Spirits & Cocktails', 'Destilados y Cócteles',
      'Classic and signature cocktails',
      'Cócteles clásicos y de autor'),
  });

  await upsertCat('soft-drinks', {
    parent_id: catDrinks.id, display_order: 3,
    ...catTr('Soft Drinks', 'Refrescos',
      'Juices, sodas and waters',
      'Zumos, refrescos y aguas'),
  });

  console.log('   13 categories ready');

  // ── 5. MENU ITEMS ────────────────────────────────────────────────────────
  console.log('→ Menu items');

  async function menuItem(nameEn, nameEs, descEn, descEs, price, catIds, allergenKeys, dietaryKeys, isSpecial = false) {
    const existing = await prisma.menuItem.findFirst({
      where: { translations: { some: { lang: 'en', name: nameEn } } },
    });
    if (existing) return existing;
    return prisma.menuItem.create({
      data: {
        price,
        is_available: true,
        is_special: isSpecial,
        translations: {
          create: [
            { lang: 'en', name: nameEn, description: descEn },
            { lang: 'es', name: nameEs, description: descEs },
          ],
        },
        categories: {
          create: catIds.map((id, i) => ({ category_id: id, display_order: i })),
        },
        ...(allergenKeys.length && {
          allergens: { create: allergenKeys.map(k => ({ allergen_id: A[k] })) },
        }),
        ...(dietaryKeys.length && {
          dietary: { create: dietaryKeys.map(k => ({ dietary_id: D[k] })) },
        }),
      },
    });
  }

  // Starters
  const gambas = await menuItem(
    'Garlic Prawns', 'Gambas al Ajillo',
    'King prawns sautéed in olive oil with garlic, chilli and white wine',
    'Gambas reales salteadas en aceite de oliva con ajo, guindilla y vino blanco',
    12.50, [catStarters.id], ['Crustaceans', 'Sulphites'], [],
  );

  const croquetas = await menuItem(
    'Ham Croquettes', 'Croquetas de Jamón Ibérico',
    'Crispy fried croquettes filled with creamy béchamel and Iberian ham',
    'Croquetas fritas y crujientes rellenas de cremosa bechamel y jamón ibérico',
    8.50, [catStarters.id], ['Gluten', 'Milk', 'Eggs'], [],
  );

  await menuItem(
    'Avocado & Tomato Salad', 'Ensalada de Aguacate y Tomate',
    'Fresh avocado, heritage tomato, red onion and fresh herbs with extra virgin olive oil',
    'Aguacate fresco, tomate de temporada, cebolla roja y hierbas frescas con aceite de oliva virgen extra',
    9.00, [catStarters.id], [], ['Vegan', 'Gluten Free'],
  );

  const padron = await menuItem(
    'Padron Peppers', 'Pimientos de Padrón',
    'Blistered Padron peppers with flaky sea salt — some are hot, some are not',
    'Pimientos de Padrón tostados con sal en escamas — unos pican y otros no',
    7.50, [catStarters.id], [], ['Vegan', 'Gluten Free'],
  );

  const boquerones = await menuItem(
    'Anchovies in Vinegar', 'Boquerones en Vinagre',
    'White anchovies marinated in white wine vinegar, served with garlic and flat-leaf parsley',
    'Boquerones blancos marinados en vinagre de vino blanco, servidos con ajo y perejil',
    9.50, [catStarters.id], ['Fish', 'Sulphites'], [],
  );

  // Fish & Seafood
  const lubina = await menuItem(
    'Grilled Sea Bass', 'Lubina a la Plancha',
    'Whole sea bass grilled over charcoal, served with roasted vegetables and saffron alioli',
    'Lubina entera a la parrilla de carbón, servida con verduras asadas y alioli de azafrán',
    22.00, [catFish.id], ['Fish', 'Eggs'], ['Gluten Free'],
  );

  const merluza = await menuItem(
    'Hake in Green Sauce', 'Merluza en Salsa Verde',
    'Pan-fried hake fillet in a green sauce of parsley, garlic, clams and white wine',
    'Filete de merluza a la sartén en salsa verde de perejil, ajo, almejas y vino blanco',
    20.00, [catFish.id], ['Fish', 'Gluten', 'Molluscs'], [],
  );

  await menuItem(
    'Grilled Baby Squid', 'Chipirones a la Plancha',
    'Tender baby squid grilled whole with lemon, capers and black olive tapenade',
    'Chipirones tiernos a la plancha con limón, alcaparras y tapenade de oliva negra',
    16.50, [catFish.id], ['Molluscs'], ['Gluten Free'],
  );

  await menuItem(
    'Galician Octopus', 'Pulpo a la Gallega',
    'Slow-cooked octopus on crushed potato with smoked paprika and extra virgin olive oil',
    'Pulpo cocido a fuego lento sobre patata machacada con pimentón ahumado y aceite de oliva virgen extra',
    19.50, [catFish.id], ['Molluscs', 'Sulphites'], [],
  );

  await menuItem(
    'Seafood Paella', 'Paella de Marisco',
    'Traditional Valencian paella with tiger prawns, mussels, clams and squid. Minimum 2 persons',
    'Paella valenciana tradicional con gambas tigre, mejillones, almejas y calamar. Mínimo 2 personas',
    24.00, [catFish.id], ['Crustaceans', 'Molluscs', 'Fish'], [],
  );

  // Meat & Poultry
  const secreto = await menuItem(
    'Iberian Pork Secreto', 'Secreto Ibérico a la Brasa',
    'Prime Iberian pork secreto grilled over oak charcoal, served with romesco sauce and seasonal greens',
    'Secreto ibérico de primera calidad a la brasa de encina, servido con salsa romesco y verduras de temporada',
    21.00, [catMeat.id], [], ['Gluten Free'],
  );

  const pollo = await menuItem(
    'Lemon & Thyme Chicken', 'Pollo al Limón y Tomillo',
    'Free-range chicken breast marinated in lemon and thyme, grilled and served with roasted potatoes',
    'Pechuga de pollo de corral marinada en limón y tomillo, a la parrilla con patatas asadas',
    17.50, [catMeat.id], [], ['Gluten Free'],
  );

  await menuItem(
    'Beef Tenderloin', 'Solomillo de Ternera',
    '220g beef tenderloin cooked to your preference, served with truffle butter and seasonal vegetables',
    'Solomillo de ternera de 220g al punto que prefiera, con mantequilla de trufa y verduras de temporada',
    28.00, [catMeat.id], ['Milk'], [],
  );

  // Vegetarian & Vegan
  await menuItem(
    'Mushroom & Truffle Risotto', 'Risotto de Setas y Trufa',
    'Arborio rice slowly cooked with wild mushrooms, white wine, Parmesan and a truffle oil finish',
    'Arroz arborio cocinado lentamente con setas silvestres, vino blanco, parmesano y aceite de trufa',
    16.00, [catVeg.id], ['Milk'], ['Vegetarian'],
  );

  await menuItem(
    'Seasonal Vegetable Wok', 'Wok de Verduras de Temporada',
    'Stir-fried seasonal vegetables in a ginger and sesame sauce with fragrant jasmine rice',
    'Verduras de temporada salteadas en salsa de jengibre y sésamo con arroz jazmín aromático',
    13.50, [catVeg.id], ['Sesame', 'Soya'], ['Vegan'],
  );

  // Desserts
  const crema = await menuItem(
    'Crema Catalana', 'Crema Catalana',
    'Classic Catalan custard with a caramelised sugar crust, scented with orange and cinnamon',
    'Clásica crema catalana con costra de azúcar caramelizado, aromatizada con naranja y canela',
    6.50, [catDesserts.id], ['Milk', 'Eggs'], ['Vegetarian', 'Gluten Free'],
  );

  const tarta = await menuItem(
    'Baked Cheesecake', 'Tarta de Queso al Horno',
    'Basque-style burnt cheesecake, light and creamy, with a seasonal berry compote',
    'Tarta de queso estilo vasco, ligera y cremosa, con compota de frutos rojos de temporada',
    7.00, [catDesserts.id], ['Milk', 'Eggs', 'Gluten'], ['Vegetarian'],
  );

  const sorbete = await menuItem(
    'Mango & Passion Fruit Sorbet', 'Sorbete de Mango y Maracuyá',
    'Three scoops of hand-churned tropical sorbet — refreshing and completely plant-based',
    'Tres bolas de sorbete tropical artesanal — refrescante y completamente vegano',
    6.00, [catDesserts.id], [], ['Vegan', 'Gluten Free'],
  );

  // Chef's Specials (is_special: true, listed in both Specials + their natural category)
  const tartar = await menuItem(
    'Bluefin Tuna Tartare', 'Tartar de Atún Rojo',
    'Hand-cut Atlantic bluefin tuna with avocado cream, sesame, ponzu and crispy wonton',
    'Atún rojo del Atlántico cortado a cuchillo con crema de aguacate, sésamo, ponzu y wonton crujiente',
    18.00, [catSpecials.id, catStarters.id], ['Fish', 'Sesame', 'Gluten', 'Soya'], [], true,
  );

  await menuItem(
    'Black Rice with Cuttlefish', 'Arroz Negro con Sepia',
    'Jet-black rice cooked in cuttlefish ink with tender cuttlefish and a saffron alioli',
    'Arroz negro cocinado en tinta de sepia con sepia tierna y alioli de azafrán',
    23.50, [catSpecials.id, catFish.id], ['Molluscs', 'Fish', 'Eggs'], [], true,
  );

  console.log('   20 menu items ready');

  // ── 6. SET MENUS ──────────────────────────────────────────────────────────
  console.log('→ Set menus');

  async function findOrCreateSetMenu(nameEn, createFn) {
    const existing = await prisma.setMenu.findFirst({
      where: { translations: { some: { lang: 'en', name: nameEn } } },
    });
    if (existing) {
      console.log(`   "${nameEn}" already exists — skipping`);
      return existing;
    }
    return createFn();
  }

  // Menú del Día — 3-course lunch menu
  await findOrCreateSetMenu('Lunch Menu', async () => {
    const sm = await prisma.setMenu.create({
      data: {
        price: 18.50,
        is_available: true,
        display_order: 1,
        translations: {
          create: [
            {
              lang: 'en', name: 'Lunch Menu',
              description: '3-course lunch menu served Monday to Friday',
              public_notes: 'Includes bread and a glass of house wine or water',
            },
            {
              lang: 'es', name: 'Menú del Día',
              description: 'Menú de 3 platos de lunes a viernes',
              public_notes: 'Incluye pan y una copa de vino de la casa o agua',
            },
          ],
        },
        categories: { create: [{ category_id: catSetMenus.id, display_order: 0 }] },
      },
    });

    const smcStarter = await prisma.setMenuCourse.create({
      data: {
        set_menu_id: sm.id, course_id: C['Starter'], display_order: 1,
        translations: { create: [
          { lang: 'en', notes: 'Choose one starter' },
          { lang: 'es', notes: 'Elija un entrante' },
        ]},
      },
    });
    const smcMain = await prisma.setMenuCourse.create({
      data: {
        set_menu_id: sm.id, course_id: C['Main Course'], display_order: 2,
        translations: { create: [
          { lang: 'en', notes: 'Choose one main course' },
          { lang: 'es', notes: 'Elija un plato principal' },
        ]},
      },
    });
    const smcDessert = await prisma.setMenuCourse.create({
      data: {
        set_menu_id: sm.id, course_id: C['Dessert'], display_order: 3,
        translations: { create: [
          { lang: 'en', notes: 'Dessert of the day' },
          { lang: 'es', notes: 'Postre del día' },
        ]},
      },
    });

    await prisma.setMenuDish.createMany({
      data: [
        { set_menu_id: sm.id, dish_id: croquetas.id, set_menu_course_id: smcStarter.id, display_order: 0 },
        { set_menu_id: sm.id, dish_id: padron.id,    set_menu_course_id: smcStarter.id, display_order: 1 },
        { set_menu_id: sm.id, dish_id: merluza.id,   set_menu_course_id: smcMain.id,    display_order: 0 },
        { set_menu_id: sm.id, dish_id: pollo.id,     set_menu_course_id: smcMain.id,    display_order: 1 },
        { set_menu_id: sm.id, dish_id: crema.id,     set_menu_course_id: smcDessert.id, display_order: 0 },
      ],
    });

    console.log('   "Lunch Menu" created');
    return sm;
  });

  // Menú Degustación — 6-dish tasting menu
  await findOrCreateSetMenu('Tasting Menu', async () => {
    const sm = await prisma.setMenu.create({
      data: {
        price: 45.00,
        is_available: true,
        display_order: 2,
        translations: {
          create: [
            {
              lang: 'en', name: 'Tasting Menu',
              description: 'A journey through our finest seasonal dishes — 6 courses',
              public_notes: 'Wine pairing available for an additional €22 per person',
            },
            {
              lang: 'es', name: 'Menú Degustación',
              description: 'Un viaje por nuestros mejores platos de temporada — 6 pases',
              public_notes: 'Maridaje de vinos disponible por €22 adicionales por persona',
            },
          ],
        },
        categories: { create: [{ category_id: catSetMenus.id, display_order: 1 }] },
      },
    });

    const smcStarter = await prisma.setMenuCourse.create({
      data: {
        set_menu_id: sm.id, course_id: C['Starter'], display_order: 1,
        translations: { create: [
          { lang: 'en', notes: 'Two starters served together' },
          { lang: 'es', notes: 'Dos entrantes servidos juntos' },
        ]},
      },
    });
    const smcMain = await prisma.setMenuCourse.create({
      data: {
        set_menu_id: sm.id, course_id: C['Main Course'], display_order: 2,
        translations: { create: [
          { lang: 'en', notes: 'Two main courses served in sequence' },
          { lang: 'es', notes: 'Dos platos principales servidos en secuencia' },
        ]},
      },
    });
    const smcDessert = await prisma.setMenuCourse.create({
      data: {
        set_menu_id: sm.id, course_id: C['Dessert'], display_order: 3,
        translations: { create: [
          { lang: 'en', notes: 'Selection of two desserts' },
          { lang: 'es', notes: 'Selección de dos postres' },
        ]},
      },
    });

    await prisma.setMenuDish.createMany({
      data: [
        { set_menu_id: sm.id, dish_id: tartar.id,     set_menu_course_id: smcStarter.id,  display_order: 0 },
        { set_menu_id: sm.id, dish_id: boquerones.id,  set_menu_course_id: smcStarter.id,  display_order: 1 },
        { set_menu_id: sm.id, dish_id: lubina.id,      set_menu_course_id: smcMain.id,     display_order: 0 },
        { set_menu_id: sm.id, dish_id: secreto.id,     set_menu_course_id: smcMain.id,     display_order: 1 },
        { set_menu_id: sm.id, dish_id: tarta.id,       set_menu_course_id: smcDessert.id,  display_order: 0 },
        { set_menu_id: sm.id, dish_id: sorbete.id,     set_menu_course_id: smcDessert.id,  display_order: 1 },
      ],
    });

    console.log('   "Tasting Menu" created');
    return sm;
  });

  console.log('\nSeed complete!');
  console.log('─'.repeat(40));
  console.log('Run: node scripts/seed-menu-data.js (safe to re-run)');
}

main()
  .catch(e => {
    console.error('\nSeed failed:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
