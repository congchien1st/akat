/**
 * raw data
 */
export interface PancakeRawResponse {
    data: PancakeRawProduct[],
    page_number: number;
    total_pages: number;
}

export interface PancakeRawProduct {
    barcode: string;
    composite_products: PancakeCompositeProducts[];
    display_id: string;
    fields: [];
    id: string;
    images: [];
    inserted_at: string;
    is_hidden: boolean;
    is_locked: boolean;
    is_removed: boolean;
    is_sell_negative_variation: boolean;
    last_imported_price: number;
    price_at_counter: number;
    product: {
        categories: [];
        display_id: string;
        image: string;
        inserted_at: string;
        is_published: boolean;
        name: string;
        note_product: string;
    }
    product_id: string;
    remain_quantity: number;
    retail_price: number;
    retail_price_after_discount: number;
    total_purchase_price: number;
    variations_warehouses: PancakeVariationWareHouses[];
    videos: string;
    weight: number;
    wholesale_price: [];
}

export interface PancakeCompositeProducts {
    component: ChildComponentComposite;
    component_id: string;
    id: string;
    quantity: number;
    shop_id: number;
    variation_id: string;
}

export interface ChildComponentComposite {
    barcode: string;
    composite_products: [];
    display_id: string;
    fields: [];
    id: string;
    images: [];
    inserted_at: string;
    is_hidden: boolean;
    is_locked: boolean;
    is_removed: boolean;
    is_sell_negative_variation: boolean;
    last_imported_price: number;
    price_at_counter: number;
    product: {
        categories: [];
        display_id: string;
        image: string;
        inserted_at: string;
        is_published: boolean;
        name: string;
        note_product: string;
    }
    product_id: string;
    remain_quantity: number;
    retail_price: number;
    retail_price_after_discount: number;
    total_purchase_price: number;
    variations_warehouses: [
        {
            actual_remain_quantity: number;
            batch_position: number;
            pending_quantity: number;
            remain_quantity: number;
            returning_quantity: number;
            shelf_position: number;
            total_quantity: number;
            waiting_quantity: number;
            warehouse_id: string;
        }
    ]
    videos: string;
    weight: number;
    wholesale_price: [];
}

export interface PancakeVariationWareHouses {
    actual_remain_quantity: number;
    batch_position: number;
    pending_quantity: number;
    remain_quantity: number;
    returning_quantity: number;
    shelf_position: number;
    total_quantity: number;
    waiting_quantity: number;
    warehouse_id: string;
}

/**
 * normalized data
 */
