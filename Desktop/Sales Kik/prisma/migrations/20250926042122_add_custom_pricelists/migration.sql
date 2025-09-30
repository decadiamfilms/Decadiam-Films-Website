-- Custom pricing table
CREATE TABLE customer_custom_prices (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    custom_price DECIMAL(10,2) NOT NULL,
    margin_percentage DECIMAL(5,2),
    cost_price DECIMAL(10,2),
    tier_override BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES "User"(id) ON DELETE CASCADE,
    UNIQUE(customer_id, product_id)
);

-- Price change history
CREATE TABLE price_change_history (
    id SERIAL PRIMARY KEY,
    customer_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2) NOT NULL,
    old_margin_percentage DECIMAL(5,2),
    new_margin_percentage DECIMAL(5,2),
    change_type VARCHAR(20) CHECK (change_type IN ('create', 'update', 'delete', 'revert')) NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    reverted_from_tier INTEGER,
    FOREIGN KEY (customer_id) REFERENCES "Customer"(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES "Product"(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES "User"(id) ON DELETE CASCADE
);

-- Pricelist templates for copying
CREATE TABLE custom_pricelist_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    source_customer_id VARCHAR(255) NOT NULL,
    category_ids TEXT, -- JSON array of category IDs included
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (source_customer_id) REFERENCES "Customer"(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES "User"(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_customer_custom_prices_customer_id ON customer_custom_prices(customer_id);
CREATE INDEX idx_customer_custom_prices_product_id ON customer_custom_prices(product_id);
CREATE INDEX idx_customer_custom_prices_active ON customer_custom_prices(is_active);

CREATE INDEX idx_price_change_history_customer_id ON price_change_history(customer_id);
CREATE INDEX idx_price_change_history_product_id ON price_change_history(product_id);
CREATE INDEX idx_price_change_history_changed_at ON price_change_history(changed_at);

CREATE INDEX idx_custom_pricelist_templates_source_customer ON custom_pricelist_templates(source_customer_id);