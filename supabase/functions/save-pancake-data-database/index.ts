import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2';
import {PancakeRawProduct, PancakeRawResponse} from "./PancakeInterface.ts";

Deno.serve(async (req) => {
  const data = await fetchPancakeProducts();
  const res = await processAndSaveProducts();


  return new Response(
    JSON.stringify(res),
    { headers: { "Content-Type": "application/json" } },
  )
})

/**
 * Hàm lấy dữ liệu từ API Pancake
 */
async function fetchPancakeProducts(page=1) {
  const api_key = Deno.env.get("PANCAKE_API_KEY");
  const shop =  await fetch(`https://pos.pages.fm/api/v1/shops?api_key=${api_key}`);
  const dataShop = await shop.json();
  const shop_id = dataShop.shops[0].pages[0].shop_id;

  const response = await fetch(`https://pos.pages.fm/api/v1/shops/${shop_id}/products/variations?api_key=${api_key}&page_number=${page}`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return await response.json();
}

/**
 * Hàm xử lý và lưu dữ liệu sản phẩm vào Supabase
 */
async function processAndSaveProducts() {
  try {
    let currentPage = 1;
    let totalPages = 1;

    do {
      console.log(`Fetching page ${currentPage}...`);
      const response = await fetchPancakeProducts(currentPage);
      totalPages = response.total_pages;

      for (const product of response.data) {
        await saveProductData(product);
      }

      currentPage++;
    } while (currentPage <= totalPages);

    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error processing data:', error);
  }
}

/**
 * Lưu dữ liệu một sản phẩm vào các bảng
 */
async function saveProductData(rawProduct: PancakeRawProduct) {
  try {
    const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
    const supabaseRoleKey = Deno.env.get("VITE_SUPABASE_SERVICE_ROL_KEY");
    if (!supabaseUrl || !supabaseRoleKey) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabase = createClient(supabaseUrl, supabaseRoleKey);

    // 1. Lưu thông tin sản phẩm cơ bản
    const {data: productData, error: productError} = await supabase
        .from('products')
        .upsert({
          id: rawProduct.id,
          product_id: rawProduct.product_id,
          display_id: rawProduct.product.display_id,
          name: rawProduct.product.name,
          note_product: rawProduct.product.note_product || '',
          image: rawProduct.product.image || '',
          is_published: rawProduct.product.is_published,
          inserted_at: rawProduct.product.inserted_at,
          categories: rawProduct.product.categories || ''
        }, {onConflict: 'id'})
        .select();

    if (productError) throw productError;

    // 2. Lưu thông tin biến thể sản phẩm
    const {error: variationError} = await supabase
        .from('product_variations')
        .upsert({
          id: rawProduct.id,
          // product_id: rawProduct.id,
          // variation_id: rawProduct.id,
          barcode: rawProduct.barcode || '',
          display_id: rawProduct.display_id || '',
          is_hidden: rawProduct.is_hidden,
          is_locked: rawProduct.is_locked,
          is_removed: rawProduct.is_removed,
          is_sell_negative_variation: rawProduct.is_sell_negative_variation,
          last_imported_price: rawProduct.last_imported_price || 0,
          price_at_counter: rawProduct.price_at_counter || 0,
          retail_price: rawProduct.retail_price || 0,
          retail_price_after_discount: rawProduct.retail_price_after_discount || 0,
          total_purchase_price: rawProduct.total_purchase_price || 0,
          remain_quantity: rawProduct.remain_quantity || 0,
          weight: rawProduct.weight || 0,
          videos: rawProduct.videos || '',
          inserted_at: rawProduct.inserted_at,
          image: rawProduct.images || '',
          wholesale_price: rawProduct.wholesale_price || ''
        }, {onConflict: 'id'});

    if (variationError) throw variationError;

    // 3. Lưu thông tin danh mục (nếu có)
    // if (rawProduct.product.categories && rawProduct.product.categories.length > 0) {
    //   for (const category of rawProduct.product.categories) {
    //     // Lưu danh mục
    //     const {data: categoryData, error: categoryError} = await supabase
    //         .from('categories')
    //         .upsert({
    //           id: category.category_id,
    //           name: category.name
    //         }, {onConflict: 'id'})
    //         .select();
    //
    //     if (categoryError) throw categoryError;
    //
    //     // Lưu quan hệ sản phẩm - danh mục
    //     const {error: productCategoryError} = await supabase
    //         .from('product_categories')
    //         .upsert({
    //           product_id: rawProduct.product_id,
    //           category_id: category.category_id
    //         }, {onConflict: ['product_id', 'category_id']});
    //
    //     if (productCategoryError) throw productCategoryError;
    //   }
    // }

    // 4. Lưu thông tin kho (nếu có)
    if (rawProduct.variations_warehouses && rawProduct.variations_warehouses.length > 0) {
      for (const warehouse of rawProduct.variations_warehouses) {
        const { error: warehouseError } = await supabase
            .from('variation_warehouses')
            .upsert({
              id: rawProduct.id,
              warehouse_id: warehouse.warehouse_id,
              actual_remain_quantity: warehouse.actual_remain_quantity || 0,
              batch_position: warehouse.batch_position || 0,
              pending_quantity: warehouse.pending_quantity || 0,
              remain_quantity: warehouse.remain_quantity || 0,
              returning_quantity: warehouse.returning_quantity || 0,
              shelf_position: warehouse.shelf_position || 0,
              total_quantity: warehouse.total_quantity || 0,
              waiting_quantity: warehouse.waiting_quantity || 0
            }, { onConflict: 'id' });

        if (warehouseError) throw warehouseError;
      }
    }

    // 5. Lưu thông tin sản phẩm tổng hợp (nếu có)
    if (rawProduct.composite_products && rawProduct.composite_products.length > 0) {
      for (const composite of rawProduct.composite_products) {
        const { error: compositeError } = await supabase
            .from('composite_products')
            .upsert({
              id: composite.id,
              variation_id: rawProduct.id,
              // component_variation_id: composite.component.id,
              component_id: composite.component_id,
              quantity: composite.quantity || 0,
              shop_id: composite.shop_id || 0
            }, { onConflict: 'id' });

        if (compositeError) throw compositeError;
      }
    }

    // 6. Lưu thông tin hình ảnh (nếu có)
    // if (rawProduct.images && rawProduct.images.length > 0) {
    //   for (let i = 0; i < rawProduct.images.length; i++) {
    //     const image = rawProduct.images[i];
    //     const { error: imageError } = await supabase
    //         .from('product_images')
    //         .upsert({
    //           id: rawProduct.id,
    //           image_url: image,
    //           display_order: i
    //         }, { onConflict: 'id' });
    //
    //     if (imageError) throw imageError;
    //   }
    // }

    // 7. Lưu thông tin giá bán buôn (nếu có)
    // if (rawProduct.wholesale_price && rawProduct.wholesale_price.length > 0) {
    //   for (let i = 0; i < rawProduct.wholesale_price.length; i++) {
    //     const price = rawProduct.wholesale_price[i];
    //     const { error: priceError } = await supabase
    //         .from('wholesale_prices')
    //         .upsert({
    //           id: rawProduct.id,
    //           min_quantity: price.min_quantity || 0,
    //           price: price.price || 0
    //         }, { onConflict: 'id' });
    //
    //     if (priceError) throw priceError;
    //   }
    // }

    console.log(`Saved product: ${rawProduct.product.name}`);
  } catch (error) {
    console.error(`Error saving product ${rawProduct.product.name}:`, error);
    throw error;
  }
}

// Chạy hàm xử lý
