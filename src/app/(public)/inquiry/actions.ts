"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  sendInquiryConfirmation,
  sendInquiryNotification,
} from "@/lib/email/inquiry";
import { getAdminEmails } from "@/lib/email/client";

export type SubmitInquiryArgs = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  desiredDelivery: string;
  message: string;
  items: Array<{ handle: string; productName: string; quantity: number }>;
};

export type SubmitInquiryResult =
  | { ok: true; inquiryNumber: string; mailSent: boolean }
  | { ok: false; error: string };

export async function submitInquiry(
  args: SubmitInquiryArgs,
): Promise<SubmitInquiryResult> {
  if (args.items.length === 0) {
    return { ok: false, error: "カートが空です" };
  }
  if (!args.companyName || !args.contactName || !args.email || !args.phone) {
    return { ok: false, error: "必須項目が未入力です" };
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

  const { data: inquiry, error: insErr } = await supabase
    .from("inquiries")
    .insert({
      inquiry_number: inquiryNumber,
      company_name: args.companyName,
      contact_name: args.contactName,
      email: args.email,
      phone: args.phone,
      desired_delivery: args.desiredDelivery,
      message: args.message || null,
    })
    .select("id, inquiry_number")
    .single();

  if (insErr || !inquiry) {
    return {
      ok: false,
      error: insErr?.message ?? "見積依頼の登録に失敗しました",
    };
  }

  const { error: itemsErr } = await supabase.from("inquiry_items").insert(
    args.items.map((item) => ({
      inquiry_id: inquiry.id,
      product_name: item.productName,
      product_handle: item.handle,
      quantity: item.quantity,
    })),
  );

  if (itemsErr) {
    return { ok: false, error: itemsErr.message };
  }

  // ここから先はメール送信。失敗しても見積依頼自体は成功扱いにする。
  const summary = {
    inquiryNumber: inquiry.inquiry_number,
    companyName: args.companyName,
    contactName: args.contactName,
    email: args.email,
    phone: args.phone,
    desiredDelivery: args.desiredDelivery,
    message: args.message,
    items: args.items,
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

  const mailSent = confirm.ok || notify.ok;

  return {
    ok: true,
    inquiryNumber: inquiry.inquiry_number,
    mailSent,
  };
}
