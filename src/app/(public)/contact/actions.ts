"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  sendInquiryConfirmation,
  sendInquiryNotification,
} from "@/lib/email/inquiry";
import { getAdminEmails } from "@/lib/email/client";

export type SubmitContactArgs = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  productName: string;
  quantity: string;
  message: string;
};

export type SubmitContactResult =
  | { ok: true; inquiryNumber: string; mailSent: boolean }
  | { ok: false; error: string };

export async function submitContact(
  args: SubmitContactArgs,
): Promise<SubmitContactResult> {
  if (
    !args.companyName ||
    !args.contactName ||
    !args.email ||
    !args.phone ||
    !args.message
  ) {
    return { ok: false, error: "必須項目が未入力です" };
  }

  // 希望数量は任意。空なら 1 扱い。
  let quantity = 1;
  if (args.quantity.trim() !== "") {
    const n = Number(args.quantity.replace(/,/g, ""));
    if (Number.isFinite(n) && n >= 1) quantity = Math.floor(n);
  }

  const supabase = createAdminClient();

  const { data: numberData, error: numErr } = await supabase.rpc(
    "generate_inquiry_number",
  );
  if (numErr || !numberData) {
    return {
      ok: false,
      error: numErr?.message ?? "受付番号の生成に失敗しました",
    };
  }
  const inquiryNumber = String(numberData);

  // 掲載外商品の問合せであることが分かるよう message に印を付けて保存
  const decoratedMessage = `【掲載外商品のお問い合わせ】\n${args.message}`;

  const { data: inquiry, error: insErr } = await supabase
    .from("inquiries")
    .insert({
      inquiry_number: inquiryNumber,
      company_name: args.companyName,
      contact_name: args.contactName,
      email: args.email,
      phone: args.phone,
      desired_delivery: "未定 / 相談したい",
      message: decoratedMessage,
    })
    .select("id, inquiry_number")
    .single();

  if (insErr || !inquiry) {
    return {
      ok: false,
      error: insErr?.message ?? "お問い合わせの登録に失敗しました",
    };
  }

  // 商品明細は自由記述 1 件（product_handle は null）
  const { error: itemErr } = await supabase.from("inquiry_items").insert({
    inquiry_id: inquiry.id,
    product_name: args.productName.trim() || "（商品名未記入）",
    product_handle: null,
    quantity,
  });
  if (itemErr) {
    return { ok: false, error: itemErr.message };
  }

  const summary = {
    inquiryNumber: inquiry.inquiry_number,
    companyName: args.companyName,
    contactName: args.contactName,
    email: args.email,
    phone: args.phone,
    desiredDelivery: "未定 / 相談したい",
    message: decoratedMessage,
    items: [
      {
        handle: "—",
        productName: args.productName.trim() || "（商品名未記入）",
        quantity,
      },
    ],
  };

  const adminEmails = await getAdminEmails(async () => {
    const { data } = await supabase
      .from("admin_users")
      .select("email")
      .in("role", ["super_admin", "admin"])
      .eq("is_active", true);
    return (data ?? [])
      .map((r) => r.email)
      .filter((e): e is string => typeof e === "string" && e.length > 0);
  });

  const [confirm, notify] = await Promise.all([
    sendInquiryConfirmation(summary),
    sendInquiryNotification(summary, adminEmails),
  ]);

  return {
    ok: true,
    inquiryNumber: inquiry.inquiry_number,
    mailSent: confirm.ok || notify.ok,
  };
}
