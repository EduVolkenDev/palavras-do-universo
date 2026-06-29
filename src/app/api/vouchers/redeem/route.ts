import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/request";
import { checkRateLimit } from "@/lib/security/rateLimit";
import {
  ACTIVE_VOUCHER_COOKIE,
  activateDiscountVoucher,
  redeemVoucherForUser,
} from "@/lib/vouchers/service";

type RedeemBody = {
  code?: unknown;
};

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  if (
    !(await checkRateLimit({
      request: req,
      scope: "voucher-redeem",
      limit: 20,
      windowMs: 60 * 60 * 1000,
    }))
  ) {
    return errorResponse("Too many voucher attempts", 429);
  }

  const parsed = await readJsonBody<RedeemBody>(req);
  if (!parsed.ok) return parsed.response;

  const code = String(parsed.body.code ?? "").trim();
  if (!code) return errorResponse("Missing voucher code");

  const auth = await requireApiUser();

  if (auth.response) {
    const activation = await activateDiscountVoucher(code);
    if (!activation.ok) {
      return errorResponse(
        activation.code === "REQUIRES_LOGIN"
          ? "Sign in to redeem this invitation"
          : activation.message,
        activation.code === "REQUIRES_LOGIN" ? 401 : 400
      );
    }

    const response = NextResponse.json({
      ok: true,
      mode: "discount",
      voucher: {
        code: activation.voucher.code,
        label: activation.voucher.label,
        discount_percent: activation.voucher.discount_percent,
        share_url: `/voucher/${activation.voucher.code}`,
      },
    });
    response.cookies.set(ACTIVE_VOUCHER_COOKIE, activation.voucher.code, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: activation.voucher.expires_at
        ? new Date(activation.voucher.expires_at)
        : undefined,
      maxAge: activation.voucher.expires_at ? undefined : 60 * 60 * 24 * 14,
    });
    return response;
  }

  try {
    const activation = await activateDiscountVoucher(code);
    if (activation.ok && activation.voucher.kind === "discount") {
      const response = NextResponse.json({
        ok: true,
        mode: "discount",
        voucher: {
          code: activation.voucher.code,
          label: activation.voucher.label,
          kind: activation.voucher.kind,
          discount_percent: activation.voucher.discount_percent,
        },
      });
      response.cookies.set(ACTIVE_VOUCHER_COOKIE, activation.voucher.code, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: activation.voucher.expires_at
          ? new Date(activation.voucher.expires_at)
          : undefined,
        maxAge: activation.voucher.expires_at ? undefined : 60 * 60 * 24 * 14,
      });
      return response;
    }

    const redeemed = await redeemVoucherForUser(auth.user, code);
    if (!redeemed.ok) {
      return errorResponse(redeemed.message, redeemed.code === "FORBIDDEN" ? 403 : 400);
    }

    const response = NextResponse.json({
      ok: true,
      mode:
        redeemed.voucher.kind === "discount"
          ? "discount"
          : redeemed.voucher.kind === "hybrid"
            ? "hybrid"
            : "invite",
      alreadyRedeemed: redeemed.alreadyRedeemed === true,
      voucher: {
        code: redeemed.voucher.code,
        label: redeemed.voucher.label,
        kind: redeemed.voucher.kind,
        discount_percent: redeemed.voucher.discount_percent,
      },
    });

    if (redeemed.voucher.kind !== "invite" && redeemed.voucher.discount_percent) {
      response.cookies.set(ACTIVE_VOUCHER_COOKIE, redeemed.voucher.code, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        expires: redeemed.voucher.expires_at
          ? new Date(redeemed.voucher.expires_at)
          : undefined,
        maxAge: redeemed.voucher.expires_at ? undefined : 60 * 60 * 24 * 14,
      });
    }

    return response;
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Could not redeem voucher";
    return errorResponse(message, 500);
  }
}
