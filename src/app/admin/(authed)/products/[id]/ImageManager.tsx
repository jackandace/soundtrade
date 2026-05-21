"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  uploadProductImages,
  deleteProductImage,
  setPrimaryProductImage,
} from "./image-actions";

export type ProductImage = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
};

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<
    { type: "ok" | "err"; text: string } | null
  >(null);

  const onUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setUploading(true);
    setMessage(null);
    const formData = new FormData(form);
    const r = await uploadProductImages(productId, formData);
    setUploading(false);
    if (r.ok) {
      form.reset();
      setMessage({ type: "ok", text: `✓ ${r.count} 枚アップロードしました` });
      startTransition(() => router.refresh());
    } else {
      setMessage({ type: "err", text: r.error });
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("この画像を削除します。よろしいですか？")) return;
    const r = await deleteProductImage(id);
    if (r.ok) {
      startTransition(() => router.refresh());
    } else {
      alert(`削除失敗: ${r.error}`);
    }
  };

  const onSetPrimary = async (id: string) => {
    const r = await setPrimaryProductImage(id);
    if (r.ok) {
      startTransition(() => router.refresh());
    } else {
      alert(`設定失敗: ${r.error}`);
    }
  };

  return (
    <div className="grid gap-4">
      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="overflow-hidden rounded-md border border-admin-line"
            >
              <div className="relative aspect-square bg-admin-surfaceAlt">
                <Image
                  src={img.url}
                  alt={img.alt_text ?? ""}
                  fill
                  sizes="(max-width: 768px) 50vw, 200px"
                  className="object-cover"
                />
                {img.is_primary && (
                  <span className="absolute left-2 top-2 rounded bg-admin-success px-1.5 py-0.5 text-admin-xs font-bold text-white">
                    メイン
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-admin-lineLight p-2">
                {img.is_primary ? (
                  <span className="text-admin-xs text-admin-inkMute">
                    表示中
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(img.id)}
                    className="text-admin-xs text-admin-info underline-offset-2 hover:underline"
                  >
                    メインに設定
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(img.id)}
                  className="text-admin-xs text-admin-danger underline-offset-2 hover:underline"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-admin-line px-4 py-6 text-center text-admin-sm text-admin-inkSub">
          まだ画像がありません。下からアップロードしてください。
        </p>
      )}

      <form
        onSubmit={onUpload}
        className="grid gap-3 rounded-md border border-admin-line bg-admin-surfaceAlt p-4"
      >
        <label className="block text-admin-sm font-medium text-admin-ink">
          新しい画像を追加
          <span className="ml-2 text-admin-xs text-admin-inkMute">
            複数選択可・jpg / png / webp / avif・各 5MB まで
          </span>
        </label>
        <input
          type="file"
          name="images"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          required
          className="block w-full rounded-md border border-admin-line bg-admin-surface p-2 text-admin-sm file:mr-3 file:rounded file:border-0 file:bg-admin-surfaceAlt file:px-3 file:py-2 file:text-admin-sm file:text-admin-ink"
        />
        {message && (
          <p
            className={`text-admin-sm ${
              message.type === "ok" ? "text-admin-success" : "text-admin-danger"
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="flex min-h-10 items-center rounded-md bg-admin-navy px-6 text-admin-sm font-bold text-white hover:bg-admin-navyHover disabled:opacity-50"
          >
            {uploading ? "アップロード中..." : "アップロード"}
          </button>
        </div>
      </form>
    </div>
  );
}
