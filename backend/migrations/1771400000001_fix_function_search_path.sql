-- Corregir la función update_updated_at_column para usar un search_path seguro
-- Esto evita ataques de secuestro de ruta de búsqueda
ALTER FUNCTION update_updated_at_column() SET search_path = public;
