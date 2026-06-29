import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { isOwnerAccessUser } from "@/lib/product/ownerAccess";
import { readJsonBody } from "@/lib/http/request";
import {
  createVoucher,
  listVouchers,
  softDeleteVoucher,
  transferVoucher,
  updateVoucher,
  type VoucherCreateInput,
  type VoucherStatus,
  type VoucherUpdateInput,
} from "@/lib/vouchers/service";

type AdminVoucherBody = {
  action?: unknown;
  id?: unknown;
  voucher?: unknown;
  status?: unknown;
  targetEmail?: unknown;
  targetUserId?: unknown;
  transferGrantedAccess?: unknown;
};

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function requireOwner() {
  const auth = await requireApiUser();
  if (auth.response) return auth;
  if (!isOwnerAccessUser(auth.user)) {
    return { user: null, response: forbidden() } as const;
  }
  return auth;
}

export async function GET() {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  try {
    const vouchers = await listVouchers();
    return NextResponse.json({ ok: true, vouchers });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not list vouchers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if (auth.response) return auth.response;

  const parsed = await readJsonBody<AdminVoucherBody>(req);
  if (!parsed.ok) return parsed.response;

  const body = parsed.body;
  const action = String(body.action ?? "").trim().toLowerCase();
  const voucherId = String(body.id ?? "").trim();

  try {
    if (action === "create") {
      if (!body.voucher || typeof body.voucher !== "object") {
        return badRequest("Missing voucher payload");
      }
      const voucher = await createVoucher(auth.user, body.voucher as VoucherCreateInput);
      return NextResponse.json({ ok: true, voucher });
    }

    if (!voucherId) return badRequest("Missing voucher id");

    if (action === "update") {
      if (!body.voucher || typeof body.voucher !== "object") {
        return badRequest("Missing voucher payload");
      }
      const voucher = await updateVoucher(
        auth.user,
        voucherId,
        body.voucher as VoucherUpdateInput
      );
      return NextResponse.json({ ok: true, voucher });
    }

    if (action === "status") {
      const nextStatus = String(body.status ?? "").trim().toLowerCase() as VoucherStatus;
      const voucher = await updateVoucher(auth.user, voucherId, { status: nextStatus });
      return NextResponse.json({ ok: true, voucher });
    }

    if (action === "transfer") {
      const voucher = await transferVoucher({
        actor: auth.user,
        voucherId,
        targetEmail: typeof body.targetEmail === "string" ? body.targetEmail : null,
        targetUserId: typeof body.targetUserId === "string" ? body.targetUserId : null,
        transferGrantedAccess: body.transferGrantedAccess === true,
      });
      return NextResponse.json({ ok: true, voucher });
    }

    if (action === "delete") {
      const voucher = await softDeleteVoucher(auth.user, voucherId);
      return NextResponse.json({ ok: true, voucher });
    }

    return badRequest("Unknown action");
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Admin voucher action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
