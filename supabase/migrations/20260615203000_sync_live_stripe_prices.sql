update public.oracle_products
set provider_price_id = case product_key
  when 'clareza_urgente' then 'price_1TigUD7HKwQp7jpa0ASHpryi'
  when 'caminho_3_cartas' then 'price_1TiMK67HKwQp7jpaMaoT8diT'
  when 'sinais_do_amor' then 'price_1TiMK07HKwQp7jpa5cMgqPOX'
  when 'circulo_do_universo' then 'price_1TiMK07HKwQp7jpaVMtLiSRO'
  else provider_price_id
end
where product_key in (
  'clareza_urgente',
  'caminho_3_cartas',
  'sinais_do_amor',
  'circulo_do_universo'
);
