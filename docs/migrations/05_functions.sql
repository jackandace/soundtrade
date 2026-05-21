-- ============================================================
-- SOUND·TRADE  Migration 05: ストアド関数
-- ============================================================
-- スナップショット作成 / ロールバック / クリーンアップ。
-- ============================================================

-- ============================================================
-- create_product_snapshot：現在の商品データ一式を保存
-- ============================================================
-- products / variants / product_specs を丸ごとJSONBスナップショット化。
-- 一括反映の直前などに呼ぶ。
CREATE OR REPLACE FUNCTION create_product_snapshot(
  p_snapshot_type TEXT,
  p_triggered_by  UUID DEFAULT NULL,
  p_related_job   UUID DEFAULT NULL,
  p_notes         TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id   UUID;
  v_data          JSONB;
  v_retention_days INTEGER;
  v_pcount INTEGER;
  v_vcount INTEGER;
  v_scount INTEGER;
BEGIN
  -- 保持日数を設定から取得
  SELECT (value #>> '{}')::INTEGER INTO v_retention_days
  FROM system_settings WHERE key = 'snapshot.retention_days';
  v_retention_days := COALESCE(v_retention_days, 30);

  -- 商品データ一式をJSONB化
  v_data := jsonb_build_object(
    'products',      COALESCE((SELECT jsonb_agg(row_to_json(p)) FROM products p), '[]'::jsonb),
    'variants',      COALESCE((SELECT jsonb_agg(row_to_json(v)) FROM variants v), '[]'::jsonb),
    'product_specs', COALESCE((SELECT jsonb_agg(row_to_json(s)) FROM product_specs s), '[]'::jsonb)
  );

  SELECT COUNT(*) INTO v_pcount FROM products;
  SELECT COUNT(*) INTO v_vcount FROM variants;
  SELECT COUNT(*) INTO v_scount FROM product_specs;

  INSERT INTO product_snapshots (
    snapshot_type, triggered_by, related_job_id, data,
    product_count, variant_count, spec_count,
    size_bytes, retention_until, notes
  ) VALUES (
    p_snapshot_type, p_triggered_by, p_related_job, v_data,
    v_pcount, v_vcount, v_scount,
    pg_column_size(v_data),
    NOW() + (v_retention_days || ' days')::INTERVAL,
    p_notes
  )
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- rollback_to_snapshot：スナップショットから商品データを復元
-- ============================================================
-- 指定スナップショットの内容で products 一式を置き換える。
-- 実行前に必ず現状のスナップショットを取る（二重の安全策）。
CREATE OR REPLACE FUNCTION rollback_to_snapshot(
  p_snapshot_id UUID,
  p_executor_id UUID
)
RETURNS TABLE (
  restored_products INTEGER,
  restored_variants INTEGER,
  restored_specs    INTEGER
) AS $$
DECLARE
  v_data JSONB;
  v_pre_snapshot_id UUID;
  v_p INTEGER; v_v INTEGER; v_s INTEGER;
BEGIN
  -- 1. ロールバック前の現状を自動スナップショット
  v_pre_snapshot_id := create_product_snapshot(
    'pre_import', p_executor_id, NULL,
    'ロールバック実行前の自動スナップショット'
  );

  -- 2. 指定スナップショットのデータ取得
  SELECT data INTO v_data FROM product_snapshots WHERE id = p_snapshot_id;
  IF v_data IS NULL THEN
    RAISE EXCEPTION 'スナップショットが見つかりません: %', p_snapshot_id;
  END IF;

  -- 3. 既存データをクリアして復元（関数全体が1トランザクション）
  TRUNCATE TABLE product_specs CASCADE;
  TRUNCATE TABLE variants CASCADE;
  TRUNCATE TABLE products CASCADE;

  -- products 復元
  INSERT INTO products
  SELECT * FROM jsonb_populate_recordset(NULL::products, v_data->'products');

  -- variants 復元
  INSERT INTO variants
  SELECT * FROM jsonb_populate_recordset(NULL::variants, v_data->'variants');

  -- product_specs 復元
  INSERT INTO product_specs
  SELECT * FROM jsonb_populate_recordset(NULL::product_specs, v_data->'product_specs');

  v_p := jsonb_array_length(v_data->'products');
  v_v := jsonb_array_length(v_data->'variants');
  v_s := jsonb_array_length(v_data->'product_specs');

  -- 4. スナップショットに使用記録
  UPDATE product_snapshots
    SET used_for_rollback_at = NOW(), used_for_rollback_by = p_executor_id
    WHERE id = p_snapshot_id;

  -- 5. 監査ログ
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, risk_level, payload)
  VALUES (p_executor_id, 'rollback_execute', 'snapshot', p_snapshot_id, 'critical',
    jsonb_build_object('pre_rollback_snapshot_id', v_pre_snapshot_id,
                       'restored_products', v_p));

  RETURN QUERY SELECT v_p, v_v, v_s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- cleanup_old_snapshots：古いスナップショットを自動削除
-- ============================================================
-- 保持期間切れ + 世代数オーバー分を削除。保護フラグ付きは除外。
CREATE OR REPLACE FUNCTION cleanup_old_snapshots()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER := 0;
  v_tmp     INTEGER;
  v_max_gen INTEGER;
BEGIN
  -- 保持期間切れを削除
  DELETE FROM product_snapshots
  WHERE is_protected = FALSE
    AND retention_until IS NOT NULL
    AND retention_until < NOW();
  GET DIAGNOSTICS v_tmp = ROW_COUNT;
  v_deleted := v_deleted + v_tmp;

  -- 世代数オーバー分を削除
  SELECT (value #>> '{}')::INTEGER INTO v_max_gen
  FROM system_settings WHERE key = 'snapshot.max_generations';
  v_max_gen := COALESCE(v_max_gen, 10);

  DELETE FROM product_snapshots
  WHERE id IN (
    SELECT id FROM product_snapshots
    WHERE is_protected = FALSE
    ORDER BY created_at DESC
    OFFSET v_max_gen
  );
  GET DIAGNOSTICS v_tmp = ROW_COUNT;
  v_deleted := v_deleted + v_tmp;

  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- generate_inquiry_number：見積依頼番号を採番
-- ============================================================
-- 形式：ST-YYYYMMDD-NNNN（その日の連番4桁）
CREATE OR REPLACE FUNCTION generate_inquiry_number()
RETURNS TEXT AS $$
DECLARE
  v_date_part TEXT;
  v_seq       INTEGER;
BEGIN
  v_date_part := TO_CHAR(NOW(), 'YYYYMMDD');

  SELECT COUNT(*) + 1 INTO v_seq
  FROM inquiries
  WHERE inquiry_number LIKE 'ST-' || v_date_part || '-%';

  RETURN 'ST-' || v_date_part || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 補足（Phase 2）：日次クリーンアップのスケジュール登録例
-- SELECT cron.schedule('cleanup_snapshots', '0 3 * * *',
--                      'SELECT cleanup_old_snapshots()');
