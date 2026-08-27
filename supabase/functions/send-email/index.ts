import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const { type, to, data } = await req.json();

    let subject = "";
    let html = "";

    if (type === "subscription_confirmed") {
      subject = "Your Makanan Subscription is Confirmed!";
      html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1a3028, #0d2b22); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #3ECBA0; margin: 0; font-size: 28px; font-weight: 700;">Makanan</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">Student Meal Programme</p>
          </div>
          <div style="padding: 40px 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px;">Subscription Confirmed! 🎉</h2>
            <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Hi ${data?.studentName || "there"},<br><br>
              Your <strong style="color: #1a3028;">${data?.planName || "meal plan"}</strong> subscription has been activated successfully.
            </p>
            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Plan</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${data?.planName || "-"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Credits</span>
                <span style="color: #3ECBA0; font-weight: 700; font-size: 14px;">${data?.credits || 0} meals</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Amount Paid</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">RM ${data?.amount || "0.00"}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6B7280; font-size: 14px;">Valid Until</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${data?.expiresAt || "-"}</span>
              </div>
            </div>
            <p style="color: #6B7280; font-size: 14px; line-height: 1.6; margin: 0;">
              You can now redeem meals at any Makanan partner restaurant. Open your dashboard to get started.
            </p>
          </div>
        </div>
      `;
    } else if (type === "redemption_confirmed") {
      subject = "Meal Redeemed Successfully";
      html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1a3028, #0d2b22); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #3ECBA0; margin: 0; font-size: 28px; font-weight: 700;">Makanan</h1>
          </div>
          <div style="padding: 40px 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px;">Meal Redeemed ✅</h2>
            <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Hi ${data?.studentName || "there"},<br><br>
              Your meal redemption has been confirmed.
            </p>
            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Meal</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${data?.mealName || "-"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Partner</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${data?.partnerName || "-"}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6B7280; font-size: 14px;">Credits Remaining</span>
                <span style="color: #3ECBA0; font-weight: 700; font-size: 14px;">${data?.creditsRemaining || 0} meals</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (type === "settlement_paid") {
      subject = "Settlement Payout Processed";
      html = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #1a3028, #0d2b22); padding: 40px 32px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: #3ECBA0; margin: 0; font-size: 28px; font-weight: 700;">Makanan</h1>
          </div>
          <div style="padding: 40px 32px; background: #f9fafb; border-radius: 0 0 12px 12px;">
            <h2 style="color: #111827; font-size: 22px; margin: 0 0 16px;">Settlement Payout Processed 💰</h2>
            <p style="color: #6B7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              Hi ${data?.partnerName || "Partner"},<br><br>
              Your settlement payout has been processed.
            </p>
            <div style="background: white; border: 1px solid #E5E7EB; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Period</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${data?.period || "-"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Total Redemptions</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${data?.totalRedemptions || 0}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6B7280; font-size: 14px;">Amount</span>
                <span style="color: #3ECBA0; font-weight: 700; font-size: 18px;">RM ${data?.amount || "0.00"}</span>
              </div>
              ${data?.reference ? `<div style="display: flex; justify-content: space-between;">
                <span style="color: #6B7280; font-size: 14px;">Reference</span>
                <span style="color: #111827; font-weight: 600; font-size: 14px;">${data.reference}</span>
              </div>` : ""}
            </div>
          </div>
        </div>
      `;
    } else {
      return new Response(JSON.stringify({ error: "Unknown email type" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
