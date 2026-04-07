-- Función para orderNumber atómico por restaurante
CREATE OR REPLACE FUNCTION next_order_number(p_restaurant_id TEXT)
RETURNS INTEGER AS $$
  INSERT INTO restaurant_order_sequences ("restaurantId", "lastOrderNumber")
  VALUES (p_restaurant_id, 1)
  ON CONFLICT ("restaurantId")
  DO UPDATE SET "lastOrderNumber" = restaurant_order_sequences."lastOrderNumber" + 1
  RETURNING "lastOrderNumber";
$$ LANGUAGE sql;
