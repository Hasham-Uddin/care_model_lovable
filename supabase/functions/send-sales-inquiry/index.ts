import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SalesInquiryRequest {
  buyerName: string;
  buyerEmail: string;
  tier: "researcher" | "enterprise" | "annual";
  recordCount?: number;
  message?: string;
}

const TIER_LABELS = {
  researcher: "Researcher ($5-$15/record)",
  enterprise: "Enterprise Bias Training ($100k-$500k+)",
  annual: "Annual License ($250k-$1M/year)",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize inputs
    const buyerName = String(body.buyerName || "").trim().slice(0, 200);
    const buyerEmail = String(body.buyerEmail || "").trim().slice(0, 255);
    const tier = String(body.tier || "").trim();
    const recordCount = typeof body.recordCount === "number" ? Math.min(Math.max(0, Math.floor(body.recordCount)), 10000000) : undefined;
    const message = String(body.message || "").trim().slice(0, 2000);

    // Validate required fields
    if (!buyerEmail || !tier) {
      throw new Error("Missing required fields: buyerEmail and tier are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(buyerEmail)) {
      throw new Error("Invalid email format");
    }

    // Validate tier
    if (!["researcher", "enterprise", "annual"].includes(tier)) {
      throw new Error("Invalid pricing tier");
    }

    const tierLabel = TIER_LABELS[tier as keyof typeof TIER_LABELS] || tier;

    // Escape HTML to prevent XSS in emails
    const escapeHtml = (str: string) =>
      str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

    const safeBuyerName = escapeHtml(buyerName);
    const safeBuyerEmail = escapeHtml(buyerEmail);
    const safeMessage = escapeHtml(message);
    const safeTierLabel = escapeHtml(tierLabel);

    // Send notification email to sales
    const salesEmailResponse = await resend.emails.send({
      from: "MEASURE Data Marketplace <noreply@resend.dev>",
      to: ["sales@yourdomain.com"], // Replace with your sales email
      reply_to: buyerEmail,
      subject: `New Data Marketplace Inquiry: ${safeTierLabel}`,
      html: `
        <h1>New Data Marketplace Inquiry</h1>
        <h2>Contact Information</h2>
        <ul>
          <li><strong>Name:</strong> ${safeBuyerName || "Not provided"}</li>
          <li><strong>Email:</strong> ${safeBuyerEmail}</li>
        </ul>
        
        <h2>Inquiry Details</h2>
        <ul>
          <li><strong>Pricing Tier:</strong> ${safeTierLabel}</li>
          ${recordCount ? `<li><strong>Requested Records:</strong> ${recordCount.toLocaleString()}</li>` : ""}
        </ul>
        
        ${safeMessage ? `<h2>Additional Message</h2><p>${safeMessage}</p>` : ""}
        
        <hr />
        <p><em>Sent from MEASURE Data Marketplace</em></p>
      `,
    });

    console.log("Sales inquiry email sent:", salesEmailResponse);

    // Send confirmation email to buyer
    const confirmationEmailResponse = await resend.emails.send({
      from: "MEASURE Data Marketplace <noreply@resend.dev>",
      to: [buyerEmail],
      subject: "We received your inquiry - MEASURE Data Marketplace",
      html: `
        <h1>Thank you for your inquiry!</h1>
        <p>Hi ${safeBuyerName || "there"},</p>
        <p>We've received your inquiry about our <strong>${safeTierLabel}</strong> plan.</p>
        ${recordCount ? `<p>Requested records: ${recordCount.toLocaleString()}</p>` : ""}
        <p>Our sales team will review your request and get back to you within 24 hours.</p>
        <br />
        <p>Best regards,</p>
        <p>The MEASURE Team</p>
      `,
    });

    console.log("Confirmation email sent:", confirmationEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Inquiry sent successfully" 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sales-inquiry function:", error?.message);
    const isValidationError = error?.message?.includes("Missing required") || 
                               error?.message?.includes("Invalid email") ||
                               error?.message?.includes("Invalid pricing");
    return new Response(
      JSON.stringify({ error: isValidationError ? error.message : "Failed to send inquiry" }),
      {
        status: isValidationError ? 400 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
