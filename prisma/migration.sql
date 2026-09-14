-- Kitchen406: 43 entities from final source table; see DECISIONS.md for additions.
CREATE TABLE "Account" (
 "account_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "email" text NOT NULL UNIQUE,
 "password_hash" text NOT NULL,
 "first_name" text NOT NULL,
 "last_name" text NOT NULL,
 "role" text NOT NULL DEFAULT 'customer' CHECK ("role" IN ('customer', 'staff', 'admin')),
 "status" text NOT NULL DEFAULT 'pending_verification' CHECK ("status" IN ('pending_verification', 'active', 'inactive', 'suspended')),
 "email_verified_at" timestamptz,
 "password_changed_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "AdminProfile" (
 "admin_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "account_id" text NOT NULL UNIQUE
);
CREATE TABLE "StaffProfile" (
 "staff_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "account_id" text NOT NULL UNIQUE,
 "is_temp_pass_changed" boolean NOT NULL DEFAULT false,
 "created_by_admin_id" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CustomerProfile" (
 "customer_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "account_id" text NOT NULL UNIQUE,
 "mobile_number" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "AccountVerification" (
 "account_verification_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "account_id" text NOT NULL,
 "purpose" text NOT NULL DEFAULT 'email_verification' CHECK ("purpose" IN ('email_verification', 'password_reset', 'email_change', 'account_setup')),
 "otp_code_hash" text NOT NULL,
 "target_email" text,
 "expires_at" timestamptz NOT NULL DEFAULT now(),
 "verified_at" timestamptz,
 "attempt_count" integer NOT NULL DEFAULT 0,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "Address" (
 "address_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "customer_id" text NOT NULL,
 "label" text NOT NULL,
 "add_line_1" text NOT NULL,
 "add_line_2" text,
 "city" text NOT NULL,
 "postal_code" text NOT NULL,
 "landmark" text,
 "latitude" numeric(14,4) NOT NULL DEFAULT 0,
 "longitude" numeric(14,4) NOT NULL DEFAULT 0,
 "is_default" boolean NOT NULL DEFAULT false,
 "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'archived')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "Category" (
 "category_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "category_name" text NOT NULL UNIQUE,
 "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "Product" (
 "product_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "category_id" text NOT NULL,
 "name" text NOT NULL,
 "description" text NOT NULL,
 "img_url" text NOT NULL,
 "subscription_eligible" boolean NOT NULL DEFAULT false,
 "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "ProductVariant" (
 "variant_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "product_id" text NOT NULL,
 "size" text NOT NULL,
 "final_price" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("final_price" >= 0),
 "suggested_price" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("suggested_price" >= 0),
 "utility_overhead" numeric(14,4) CHECK ("utility_overhead" >= 0),
 "status" text NOT NULL DEFAULT 'available' CHECK ("status" IN ('available', 'unavailable')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "PricingConfig" (
 "pricing_config_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "default_utility_overhead" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("default_utility_overhead" >= 0),
 "markup_percentage" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("markup_percentage" >= 0),
 "updated_by_admin_id" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "Inventory" (
 "inventory_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "name" text NOT NULL,
 "unit" text NOT NULL,
 "stock_on_hand" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("stock_on_hand" >= 0),
 "reorder_threshold" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("reorder_threshold" >= 0),
 "cost_per_unit" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("cost_per_unit" >= 0),
 "status" text NOT NULL DEFAULT 'available' CHECK ("status" IN ('available', 'unavailable', 'low_stock')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "ProductBOM" (
 "product_bom_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "variant_id" text NOT NULL,
 "inventory_id" text NOT NULL,
 "quantity_required" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("quantity_required" > 0) CHECK ("quantity_required" >= 0),
 UNIQUE ("variant_id", "inventory_id")
);
CREATE TABLE "Cart" (
 "cart_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "customer_id" text NOT NULL UNIQUE,
 "subtotal" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("subtotal" >= 0),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CartItem" (
 "cart_item_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "cart_id" text NOT NULL,
 "variant_id" text NOT NULL,
 "quantity" integer NOT NULL CHECK ("quantity" > 0),
 "added_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 UNIQUE ("cart_id", "variant_id")
);
CREATE TABLE "Order" (
 "order_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "customer_id" text NOT NULL,
 "cart_id" text,
 "address_id" text,
 "address_snapshot" jsonb,
 "ref_number" text NOT NULL UNIQUE,
 "type" text NOT NULL DEFAULT 'standard_purchase' CHECK ("type" IN ('standard_purchase', 'subscription_purchase', 'subscription_fulfillment', 'custom_cake_purchase')),
 "total" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("total" >= 0),
 "amount_payable" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("amount_payable" >= 0),
 "placed_at" timestamptz NOT NULL DEFAULT now(),
 "fulfillment_date" date,
 "fulfillment_method" text CHECK ("fulfillment_method" IN ('pickup', 'delivery')),
 "status" text NOT NULL DEFAULT 'pending_payment' CHECK ("status" IN ('pending_payment', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'payment_resolution_required')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "OrderStatusHistory" (
 "history_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_id" text NOT NULL,
 "status" text NOT NULL,
 "changed_by_account_id" text,
 "changed_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "OrderItem" (
 "order_item_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_id" text NOT NULL,
 "variant_id" text,
 "quotation_id" text UNIQUE,
 "quantity" integer NOT NULL CHECK ("quantity" > 0),
 "unit_price_snapshot" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("unit_price_snapshot" >= 0)
);
CREATE TABLE "CheckoutHold" (
 "hold_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_id" text NOT NULL,
 "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'confirmed', 'released', 'expired')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "expires_at" timestamptz NOT NULL DEFAULT now(),
 "confirmed_at" timestamptz,
 "released_at" timestamptz
);
CREATE TABLE "Payment" (
 "payment_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_id" text NOT NULL,
 "hold_id" text NOT NULL UNIQUE,
 "paymongo_id" text NOT NULL UNIQUE,
 "amount" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("amount" >= 0),
 "qr_img_url" text NOT NULL,
 "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'paid', 'failed', 'expired', 'cancelled')),
 "failure_code" text,
 "failure_message" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "expires_at" timestamptz NOT NULL DEFAULT now(),
 "paid_at" timestamptz
);
CREATE TABLE "Delivery" (
 "delivery_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_id" text NOT NULL,
 "lalamove_id" text UNIQUE,
 "longitude" numeric(14,4) NOT NULL DEFAULT 0,
 "latitude" numeric(14,4) NOT NULL DEFAULT 0,
 "fee" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("fee" >= 0),
 "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'booked', 'in_transit', 'delivered', 'failed', 'cancelled')),
 "delivered_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CapacityConfig" (
 "capacity_config_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_type" text NOT NULL DEFAULT 'standard' UNIQUE CHECK ("order_type" IN ('standard', 'subscription', 'custom_cake')),
 "max_varieties_per_day" integer,
 "max_cakes_per_week" integer,
 "max_cakes_per_day" integer,
 "max_units" integer,
 "cutoff_time" text NOT NULL,
 "lead_time_value" integer NOT NULL,
 "lead_time_unit" text NOT NULL DEFAULT 'hours' CHECK ("lead_time_unit" IN ('hours', 'days')),
 "created_by_admin_id" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CapacityAllocation" (
 "allocation_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "capacity_config_id" text NOT NULL,
 "product_id" text,
 "source_order_id" text NOT NULL,
 "fulfillment_order_id" text,
 "hold_id" text,
 "cycle_number" integer,
 "fulfillment_date" date NOT NULL,
 "quantity" integer NOT NULL CHECK ("quantity" > 0),
 "status" text NOT NULL DEFAULT 'held' CHECK ("status" IN ('held', 'confirmed', 'fulfilled', 'released', 'expired')),
 "expires_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "released_at" timestamptz
);
CREATE TABLE "BlockedDate" (
 "blocked_date_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "date" date NOT NULL UNIQUE,
 "reason" text,
 "created_by_admin_id" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "SubscriptionSchedule" (
 "schedule_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "product_id" text,
 "preparation_day" integer NOT NULL,
 "fulfillment_day" integer NOT NULL,
 "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive')),
 "created_by_admin_id" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "Subscription" (
 "subscription_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "customer_id" text NOT NULL,
 "variant_id" text NOT NULL,
 "purchase_order_id" text NOT NULL UNIQUE,
 "address_id" text NOT NULL,
 "schedule_id" text NOT NULL,
 "quantity_per_delivery" integer NOT NULL CHECK ("quantity_per_delivery" > 0),
 "product_total" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("product_total" >= 0),
 "delivery_fee_total" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("delivery_fee_total" >= 0),
 "total_price" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("total_price" >= 0),
 "start_date" date NOT NULL,
 "status" text NOT NULL DEFAULT 'pending_payment' CHECK ("status" IN ('pending_payment', 'active', 'completed', 'cancelled')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "SubscriptionDelivery" (
 "subscription_delivery_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "subscription_id" text NOT NULL,
 "fulfillment_order_id" text NOT NULL UNIQUE,
 "cycle_number" integer NOT NULL CHECK ("cycle_number" IN ('1', '2', '3', '4')),
 "original_scheduled_date" date NOT NULL,
 "scheduled_date" date NOT NULL,
 "status" text NOT NULL DEFAULT 'scheduled' CHECK ("status" IN ('scheduled', 'preparing', 'ready', 'fulfilled', 'cancelled')),
 "fulfilled_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 UNIQUE ("subscription_id", "cycle_number")
);
CREATE TABLE "SubscriptionDeferment" (
 "deferment_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "subscription_id" text NOT NULL UNIQUE,
 "subscription_delivery_id" text NOT NULL UNIQUE,
 "original_allocation_id" text NOT NULL,
 "replacement_allocation_id" text NOT NULL UNIQUE,
 "original_scheduled_date" date NOT NULL,
 "new_scheduled_date" date NOT NULL,
 "deferment_option" text NOT NULL DEFAULT 'next_week' CHECK ("deferment_option" IN ('next_week', 'next_day')),
 "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "OrderMaterialRequirement" (
 "requirement_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_id" text NOT NULL,
 "inventory_id" text NOT NULL,
 "quantity_required" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("quantity_required" > 0) CHECK ("quantity_required" >= 0),
 "fulfillment_date" date NOT NULL,
 "reserve_at" timestamptz NOT NULL DEFAULT now(),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 UNIQUE ("order_id", "inventory_id")
);
CREATE TABLE "InventoryReservation" (
 "reservation_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "requirement_id" text NOT NULL,
 "hold_id" text,
 "quantity" numeric(14,4) NOT NULL CHECK ("quantity" > 0),
 "status" text NOT NULL DEFAULT 'held' CHECK ("status" IN ('held', 'confirmed', 'consumed', 'released', 'expired')),
 "expires_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "consumed_at" timestamptz,
 "released_at" timestamptz
);
CREATE TABLE "InventoryMovement" (
 "movement_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "inventory_id" text NOT NULL,
 "order_id" text,
 "reservation_id" text,
 "performed_by_account_id" text,
 "movement_type" text NOT NULL DEFAULT 'consumption' CHECK ("movement_type" IN ('consumption', 'consumption_reversal', 'restock', 'adjustment')),
 "quantity_change" numeric(14,4) NOT NULL DEFAULT 0,
 "unit_cost_snapshot" numeric(14,4) CHECK ("unit_cost_snapshot" >= 0),
 "reason" text CHECK ("reason" IN ('spoilage', 'damage', 'miscount', 'theft', 'correction', 'other')),
 "notes" text,
 "operation_key" text NOT NULL UNIQUE,
 "occurred_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CustomCakeRequest" (
 "custom_request_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "customer_id" text NOT NULL,
 "address_id" text,
 "shape_option_id" text NOT NULL,
 "flavor_option_id" text NOT NULL,
 "size_option_id" text NOT NULL,
 "color_option_id" text NOT NULL,
 "icing_option_id" text NOT NULL,
 "accepted_quotation_id" text UNIQUE,
 "ref_number" text NOT NULL UNIQUE,
 "design_description" text NOT NULL,
 "img_url" text,
 "estimated_price" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("estimated_price" >= 0),
 "requested_date" date NOT NULL,
 "requested_delivery_window" text NOT NULL DEFAULT 'morning' CHECK ("requested_delivery_window" IN ('morning', 'afternoon', 'evening')),
 "fulfillment_method" text CHECK ("fulfillment_method" IN ('pickup', 'delivery')),
 "status" text NOT NULL DEFAULT 'pending_review' CHECK ("status" IN ('pending_review', 'negotiating', 'quoted', 'accepted', 'rejected', 'expired')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CakeOption" (
 "option_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "created_by_admin_id" text NOT NULL,
 "option_type" text NOT NULL DEFAULT 'shape' CHECK ("option_type" IN ('shape', 'flavor', 'size', 'color', 'icing')),
 "scale_factor" numeric(14,4) CHECK ("scale_factor" > 0) CHECK ("scale_factor" >= 0),
 "option_name" text NOT NULL,
 "price" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("price" >= 0),
 "status" text NOT NULL DEFAULT 'available' CHECK ("status" IN ('available', 'unavailable')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CakeOptionIngredient" (
 "option_ingredient_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "option_id" text NOT NULL,
 "inventory_id" text NOT NULL,
 "quantity_required" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("quantity_required" > 0) CHECK ("quantity_required" >= 0),
 UNIQUE ("option_id", "inventory_id")
);
CREATE TABLE "CakeAddon" (
 "addon_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "created_by_admin_id" text NOT NULL,
 "name" text NOT NULL,
 "price" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("price" >= 0),
 "status" text NOT NULL DEFAULT 'available' CHECK ("status" IN ('available', 'unavailable')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CakeAddonIngredient" (
 "addon_ingredient_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "addon_id" text NOT NULL,
 "inventory_id" text NOT NULL,
 "quantity_required" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("quantity_required" > 0) CHECK ("quantity_required" >= 0),
 UNIQUE ("addon_id", "inventory_id")
);
CREATE TABLE "CakeRequestAddon" (
 "cake_request_addon_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "custom_request_id" text NOT NULL,
 "addon_id" text NOT NULL,
 "quantity" integer NOT NULL CHECK ("quantity" > 0),
 UNIQUE ("custom_request_id", "addon_id")
);
CREATE TABLE "CustomCakeQuotation" (
 "quotation_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "custom_request_id" text NOT NULL,
 "version_number" integer NOT NULL,
 "created_by_admin_id" text NOT NULL,
 "fulfillment_date" date NOT NULL,
 "delivery_window" text NOT NULL DEFAULT 'morning' CHECK ("delivery_window" IN ('morning', 'afternoon', 'evening')),
 "fulfillment_method" text NOT NULL DEFAULT 'pickup' CHECK ("fulfillment_method" IN ('pickup', 'delivery')),
 "address_snapshot" jsonb,
 "options_total" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("options_total" >= 0),
 "addons_total" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("addons_total" >= 0),
 "complexity_charge" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("complexity_charge" >= 0),
 "delivery_fee" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("delivery_fee" >= 0),
 "total" numeric(14,4) NOT NULL DEFAULT 0 CHECK ("total" >= 0),
 "status" text NOT NULL DEFAULT 'draft' CHECK ("status" IN ('draft', 'issued', 'superseded', 'accepted', 'rejected', 'expired')),
 "issued_at" timestamptz,
 "expires_at" timestamptz,
 "accepted_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 UNIQUE ("custom_request_id", "version_number")
);
CREATE TABLE "PostDraft" (
 "draft_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "product_id" text,
 "occasion_id" text,
 "reviewed_by_admin_id" text,
 "category" text NOT NULL DEFAULT 'new_product_launch' CHECK ("category" IN ('new_product_launch', 'product_highlight', 'subscription_slots_reminder', 'seasonal_occasion')),
 "caption" text NOT NULL,
 "img_url" text NOT NULL,
 "status" text NOT NULL DEFAULT 'pending_review' CHECK ("status" IN ('pending_review', 'approved', 'rejected')),
 "regenerate_count" integer NOT NULL DEFAULT 0,
 "was_edited" boolean NOT NULL DEFAULT false,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 "reviewed_at" timestamptz
);
CREATE TABLE "SeasonalOccasion" (
 "occasion_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "created_by_admin_id" text NOT NULL,
 "name" text NOT NULL,
 "start_date" date NOT NULL,
 "end_date" date NOT NULL,
 "status" text NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'inactive')),
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "NotificationLog" (
 "notification_log_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "recipient_account_id" text NOT NULL,
 "type" text NOT NULL DEFAULT 'order_confirmed' CHECK ("type" IN ('order_confirmed', 'order_status_update', 'delivery_status_update', 'subscription_delivery_reminder', 'subscription_delivery_deferred', 'subscription_status_update', 'custom_cake_status_update', 'subscription_renewal_reminder', 'email_verification_otp', 'password_reset_otp', 'account_setup')),
 "provider" text NOT NULL DEFAULT 'brevo' CHECK ("provider" IN ('brevo', 'semaphore')),
 "status" text NOT NULL DEFAULT 'pending' CHECK ("status" IN ('pending', 'sent', 'failed')),
 "error_message" text,
 "sent_at" timestamptz,
 "related_entity_type" text NOT NULL DEFAULT 'order' CHECK ("related_entity_type" IN ('order', 'subscription', 'subscription_deferment', 'custom_cake_request', 'delivery', 'payment', 'account_verification')),
 "related_entity_id" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "SystemNotification" (
 "system_notification_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "recipient_role" text NOT NULL DEFAULT 'admin' CHECK ("recipient_role" IN ('admin', 'staff', 'all')),
 "notification_type" text NOT NULL DEFAULT 'new_order' CHECK ("notification_type" IN ('new_order', 'custom_cake_submitted', 'low_stock_alert', 'subscription_deferment_completed', 'payment_received', 'post_draft_ready', 'notification_send_failed')),
 "message" text NOT NULL,
 "related_entity_type" text NOT NULL DEFAULT 'order' CHECK ("related_entity_type" IN ('order', 'custom_cake_request', 'inventory', 'subscription', 'subscription_deferment', 'payment', 'post_draft', 'notification_log')),
 "related_entity_id" text NOT NULL,
 "is_read" boolean NOT NULL DEFAULT false,
 "read_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "CustomerFeedback" (
 "feedback_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "order_item_id" text NOT NULL UNIQUE,
 "customer_id" text NOT NULL,
 "hidden_by_admin_id" text,
 "rating" integer NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
 "comment" text,
 "status" text NOT NULL DEFAULT 'visible' CHECK ("status" IN ('visible', 'hidden')),
 "hidden_reason" text CHECK ("hidden_reason" IN ('spam', 'abusive_language', 'off_topic', 'sexual_content', 'other')),
 "hidden_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE "FeedbackImage" (
 "feedback_image_id" text PRIMARY KEY DEFAULT gen_random_uuid()::text,
 "feedback_id" text NOT NULL,
 "img_url" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "AdminProfile" ADD FOREIGN KEY ("account_id") REFERENCES "Account" ("account_id") ON DELETE RESTRICT;
ALTER TABLE "StaffProfile" ADD FOREIGN KEY ("account_id") REFERENCES "Account" ("account_id") ON DELETE RESTRICT;
ALTER TABLE "StaffProfile" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "CustomerProfile" ADD FOREIGN KEY ("account_id") REFERENCES "Account" ("account_id") ON DELETE RESTRICT;
ALTER TABLE "AccountVerification" ADD FOREIGN KEY ("account_id") REFERENCES "Account" ("account_id") ON DELETE RESTRICT;
ALTER TABLE "Address" ADD FOREIGN KEY ("customer_id") REFERENCES "CustomerProfile" ("customer_id") ON DELETE RESTRICT;
ALTER TABLE "Product" ADD FOREIGN KEY ("category_id") REFERENCES "Category" ("category_id") ON DELETE RESTRICT;
ALTER TABLE "ProductVariant" ADD FOREIGN KEY ("product_id") REFERENCES "Product" ("product_id") ON DELETE RESTRICT;
ALTER TABLE "PricingConfig" ADD FOREIGN KEY ("updated_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "ProductBOM" ADD FOREIGN KEY ("variant_id") REFERENCES "ProductVariant" ("variant_id") ON DELETE RESTRICT;
ALTER TABLE "ProductBOM" ADD FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("inventory_id") ON DELETE RESTRICT;
ALTER TABLE "Cart" ADD FOREIGN KEY ("customer_id") REFERENCES "CustomerProfile" ("customer_id") ON DELETE RESTRICT;
ALTER TABLE "CartItem" ADD FOREIGN KEY ("cart_id") REFERENCES "Cart" ("cart_id") ON DELETE RESTRICT;
ALTER TABLE "CartItem" ADD FOREIGN KEY ("variant_id") REFERENCES "ProductVariant" ("variant_id") ON DELETE RESTRICT;
ALTER TABLE "Order" ADD FOREIGN KEY ("customer_id") REFERENCES "CustomerProfile" ("customer_id") ON DELETE RESTRICT;
ALTER TABLE "Order" ADD FOREIGN KEY ("cart_id") REFERENCES "Cart" ("cart_id") ON DELETE RESTRICT;
ALTER TABLE "Order" ADD FOREIGN KEY ("address_id") REFERENCES "Address" ("address_id") ON DELETE RESTRICT;
ALTER TABLE "OrderStatusHistory" ADD FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "OrderStatusHistory" ADD FOREIGN KEY ("changed_by_account_id") REFERENCES "Account" ("account_id") ON DELETE RESTRICT;
ALTER TABLE "OrderItem" ADD FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "OrderItem" ADD FOREIGN KEY ("variant_id") REFERENCES "ProductVariant" ("variant_id") ON DELETE RESTRICT;
ALTER TABLE "OrderItem" ADD FOREIGN KEY ("quotation_id") REFERENCES "CustomCakeQuotation" ("quotation_id") ON DELETE RESTRICT;
ALTER TABLE "CheckoutHold" ADD FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "Payment" ADD FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "Payment" ADD FOREIGN KEY ("hold_id") REFERENCES "CheckoutHold" ("hold_id") ON DELETE RESTRICT;
ALTER TABLE "Delivery" ADD FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "CapacityConfig" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "CapacityAllocation" ADD FOREIGN KEY ("capacity_config_id") REFERENCES "CapacityConfig" ("capacity_config_id") ON DELETE RESTRICT;
ALTER TABLE "CapacityAllocation" ADD FOREIGN KEY ("product_id") REFERENCES "Product" ("product_id") ON DELETE RESTRICT;
ALTER TABLE "CapacityAllocation" ADD FOREIGN KEY ("source_order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "CapacityAllocation" ADD FOREIGN KEY ("fulfillment_order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "CapacityAllocation" ADD FOREIGN KEY ("hold_id") REFERENCES "CheckoutHold" ("hold_id") ON DELETE RESTRICT;
ALTER TABLE "BlockedDate" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionSchedule" ADD FOREIGN KEY ("product_id") REFERENCES "Product" ("product_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionSchedule" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "Subscription" ADD FOREIGN KEY ("customer_id") REFERENCES "CustomerProfile" ("customer_id") ON DELETE RESTRICT;
ALTER TABLE "Subscription" ADD FOREIGN KEY ("variant_id") REFERENCES "ProductVariant" ("variant_id") ON DELETE RESTRICT;
ALTER TABLE "Subscription" ADD FOREIGN KEY ("purchase_order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "Subscription" ADD FOREIGN KEY ("address_id") REFERENCES "Address" ("address_id") ON DELETE RESTRICT;
ALTER TABLE "Subscription" ADD FOREIGN KEY ("schedule_id") REFERENCES "SubscriptionSchedule" ("schedule_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionDelivery" ADD FOREIGN KEY ("subscription_id") REFERENCES "Subscription" ("subscription_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionDelivery" ADD FOREIGN KEY ("fulfillment_order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionDeferment" ADD FOREIGN KEY ("subscription_id") REFERENCES "Subscription" ("subscription_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionDeferment" ADD FOREIGN KEY ("subscription_delivery_id") REFERENCES "SubscriptionDelivery" ("subscription_delivery_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionDeferment" ADD FOREIGN KEY ("original_allocation_id") REFERENCES "CapacityAllocation" ("allocation_id") ON DELETE RESTRICT;
ALTER TABLE "SubscriptionDeferment" ADD FOREIGN KEY ("replacement_allocation_id") REFERENCES "CapacityAllocation" ("allocation_id") ON DELETE RESTRICT;
ALTER TABLE "OrderMaterialRequirement" ADD FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "OrderMaterialRequirement" ADD FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("inventory_id") ON DELETE RESTRICT;
ALTER TABLE "InventoryReservation" ADD FOREIGN KEY ("requirement_id") REFERENCES "OrderMaterialRequirement" ("requirement_id") ON DELETE RESTRICT;
ALTER TABLE "InventoryReservation" ADD FOREIGN KEY ("hold_id") REFERENCES "CheckoutHold" ("hold_id") ON DELETE RESTRICT;
ALTER TABLE "InventoryMovement" ADD FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("inventory_id") ON DELETE RESTRICT;
ALTER TABLE "InventoryMovement" ADD FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id") ON DELETE RESTRICT;
ALTER TABLE "InventoryMovement" ADD FOREIGN KEY ("reservation_id") REFERENCES "InventoryReservation" ("reservation_id") ON DELETE RESTRICT;
ALTER TABLE "InventoryMovement" ADD FOREIGN KEY ("performed_by_account_id") REFERENCES "Account" ("account_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("customer_id") REFERENCES "CustomerProfile" ("customer_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("address_id") REFERENCES "Address" ("address_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("shape_option_id") REFERENCES "CakeOption" ("option_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("flavor_option_id") REFERENCES "CakeOption" ("option_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("size_option_id") REFERENCES "CakeOption" ("option_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("color_option_id") REFERENCES "CakeOption" ("option_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("icing_option_id") REFERENCES "CakeOption" ("option_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeRequest" ADD FOREIGN KEY ("accepted_quotation_id") REFERENCES "CustomCakeQuotation" ("quotation_id") ON DELETE RESTRICT;
ALTER TABLE "CakeOption" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "CakeOptionIngredient" ADD FOREIGN KEY ("option_id") REFERENCES "CakeOption" ("option_id") ON DELETE RESTRICT;
ALTER TABLE "CakeOptionIngredient" ADD FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("inventory_id") ON DELETE RESTRICT;
ALTER TABLE "CakeAddon" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "CakeAddonIngredient" ADD FOREIGN KEY ("addon_id") REFERENCES "CakeAddon" ("addon_id") ON DELETE RESTRICT;
ALTER TABLE "CakeAddonIngredient" ADD FOREIGN KEY ("inventory_id") REFERENCES "Inventory" ("inventory_id") ON DELETE RESTRICT;
ALTER TABLE "CakeRequestAddon" ADD FOREIGN KEY ("custom_request_id") REFERENCES "CustomCakeRequest" ("custom_request_id") ON DELETE RESTRICT;
ALTER TABLE "CakeRequestAddon" ADD FOREIGN KEY ("addon_id") REFERENCES "CakeAddon" ("addon_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeQuotation" ADD FOREIGN KEY ("custom_request_id") REFERENCES "CustomCakeRequest" ("custom_request_id") ON DELETE RESTRICT;
ALTER TABLE "CustomCakeQuotation" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "PostDraft" ADD FOREIGN KEY ("product_id") REFERENCES "Product" ("product_id") ON DELETE RESTRICT;
ALTER TABLE "PostDraft" ADD FOREIGN KEY ("occasion_id") REFERENCES "SeasonalOccasion" ("occasion_id") ON DELETE RESTRICT;
ALTER TABLE "PostDraft" ADD FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "SeasonalOccasion" ADD FOREIGN KEY ("created_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "NotificationLog" ADD FOREIGN KEY ("recipient_account_id") REFERENCES "Account" ("account_id") ON DELETE RESTRICT;
ALTER TABLE "CustomerFeedback" ADD FOREIGN KEY ("order_item_id") REFERENCES "OrderItem" ("order_item_id") ON DELETE RESTRICT;
ALTER TABLE "CustomerFeedback" ADD FOREIGN KEY ("customer_id") REFERENCES "CustomerProfile" ("customer_id") ON DELETE RESTRICT;
ALTER TABLE "CustomerFeedback" ADD FOREIGN KEY ("hidden_by_admin_id") REFERENCES "AdminProfile" ("admin_id") ON DELETE RESTRICT;
ALTER TABLE "FeedbackImage" ADD FOREIGN KEY ("feedback_id") REFERENCES "CustomerFeedback" ("feedback_id") ON DELETE RESTRICT;
ALTER TABLE "Order" ADD checkout_delivery_fee numeric(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD material_cost_snapshot numeric(14,4) NOT NULL DEFAULT 0, ADD overhead_cost_snapshot numeric(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "CustomCakeQuotation" ADD specification_snapshot jsonb NOT NULL DEFAULT '{}', ADD material_cost_snapshot numeric(14,4) NOT NULL DEFAULT 0;
ALTER TABLE "PostDraft" ADD trigger_key text UNIQUE;
ALTER TABLE "NotificationLog" ADD attempt_count integer NOT NULL DEFAULT 0, ADD next_attempt_at timestamptz, ADD provider_message_id text, ADD event_key text UNIQUE;
ALTER TABLE "OrderItem" ADD CHECK ((variant_id IS NOT NULL)::integer + (quotation_id IS NOT NULL)::integer = 1);
CREATE UNIQUE INDEX one_active_hold ON "CheckoutHold"(order_id) WHERE status='active';
CREATE UNIQUE INDEX one_active_reservation ON "InventoryReservation"(requirement_id) WHERE status IN ('held','confirmed');
CREATE UNIQUE INDEX one_active_delivery ON "Delivery"(order_id) WHERE status IN ('pending','booked','in_transit');
CREATE UNIQUE INDEX one_default_address ON "Address"(customer_id) WHERE is_default AND status='active';
CREATE UNIQUE INDEX singleton_pricing ON "PricingConfig" ((true));
CREATE INDEX allocations_date ON "CapacityAllocation"(fulfillment_date,status);
CREATE INDEX requirements_due ON "OrderMaterialRequirement"(reserve_at);
CREATE INDEX payment_status ON "Payment"(status);
CREATE INDEX order_customer ON "Order"(customer_id);
CREATE OR REPLACE FUNCTION validate_business_links() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE role_value text;
BEGIN
 IF TG_TABLE_NAME IN ('AdminProfile','CustomerProfile','StaffProfile') THEN
  SELECT role INTO role_value FROM "Account" WHERE account_id=NEW.account_id;
  IF role_value <> (CASE TG_TABLE_NAME WHEN 'AdminProfile' THEN 'admin' WHEN 'StaffProfile' THEN 'staff' ELSE 'customer' END) THEN RAISE EXCEPTION 'Account role/profile mismatch'; END IF;
 ELSIF TG_TABLE_NAME='Order' THEN
  IF NEW.address_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Address" WHERE address_id=NEW.address_id AND customer_id=NEW.customer_id) THEN RAISE EXCEPTION 'Address ownership mismatch'; END IF;
 ELSIF TG_TABLE_NAME='CustomCakeRequest' THEN
  IF NEW.accepted_quotation_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "CustomCakeQuotation" WHERE quotation_id=NEW.accepted_quotation_id AND custom_request_id=NEW.custom_request_id) THEN RAISE EXCEPTION 'Quotation request mismatch'; END IF;
  IF EXISTS (SELECT 1 FROM (VALUES (NEW.shape_option_id,'shape'),(NEW.flavor_option_id,'flavor'),(NEW.size_option_id,'size'),(NEW.color_option_id,'color'),(NEW.icing_option_id,'icing')) v(id,kind) LEFT JOIN "CakeOption" c ON c.option_id=v.id WHERE c.option_type IS DISTINCT FROM v.kind) THEN RAISE EXCEPTION 'Cake option type mismatch'; END IF;
 ELSIF TG_TABLE_NAME='FeedbackImage' THEN
  PERFORM 1 FROM "CustomerFeedback" WHERE feedback_id=NEW.feedback_id FOR UPDATE;
  IF (SELECT count(*) FROM "FeedbackImage" WHERE feedback_id=NEW.feedback_id AND feedback_image_id<>NEW.feedback_image_id)>=2 THEN RAISE EXCEPTION 'Maximum two review photos'; END IF;
 ELSIF TG_TABLE_NAME='CustomerFeedback' THEN
  IF NOT EXISTS (SELECT 1 FROM "OrderItem" i JOIN "Order" o USING(order_id) WHERE i.order_item_id=NEW.order_item_id AND o.customer_id=NEW.customer_id AND o.status='completed' AND o.type<>'subscription_purchase') THEN RAISE EXCEPTION 'Review requires own completed fulfillment'; END IF;
 ELSIF TG_TABLE_NAME='SubscriptionDeferment' THEN
  IF NOT EXISTS (SELECT 1 FROM "SubscriptionDelivery" WHERE subscription_delivery_id=NEW.subscription_delivery_id AND subscription_id=NEW.subscription_id) THEN RAISE EXCEPTION 'Deferment subscription mismatch'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "AdminProfile" FOR EACH ROW EXECUTE FUNCTION validate_business_links();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "CustomerProfile" FOR EACH ROW EXECUTE FUNCTION validate_business_links();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "StaffProfile" FOR EACH ROW EXECUTE FUNCTION validate_business_links();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "Order" FOR EACH ROW EXECUTE FUNCTION validate_business_links();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "CustomCakeRequest" FOR EACH ROW EXECUTE FUNCTION validate_business_links();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "FeedbackImage" FOR EACH ROW EXECUTE FUNCTION validate_business_links();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "CustomerFeedback" FOR EACH ROW EXECUTE FUNCTION validate_business_links();
CREATE TRIGGER validate_links BEFORE INSERT OR UPDATE ON "SubscriptionDeferment" FOR EACH ROW EXECUTE FUNCTION validate_business_links();

CREATE OR REPLACE FUNCTION check_four_deliveries() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE sid text;
BEGIN
 sid=CASE WHEN TG_TABLE_NAME='Subscription' THEN NEW.subscription_id ELSE COALESCE(NEW.subscription_id,OLD.subscription_id) END;
 IF EXISTS(SELECT 1 FROM "Subscription" WHERE subscription_id=sid) AND (SELECT count(*) FROM "SubscriptionDelivery" WHERE subscription_id=sid)<>4 THEN RAISE EXCEPTION 'Subscription must have exactly four deliveries'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER four_deliveries AFTER INSERT OR UPDATE ON "Subscription" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_four_deliveries();
CREATE CONSTRAINT TRIGGER four_deliveries AFTER INSERT OR UPDATE OR DELETE ON "SubscriptionDelivery" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_four_deliveries();
