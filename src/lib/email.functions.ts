import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM_DEFAULT = "Verdya <onboarding@resend.dev>";

async function sendViaResend(payload: { to: string | string[]; subject: string; html: string; from?: string }) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    throw new Error(
      "Email sending is not configured. Connect Resend in the Lovable integrations panel to enable newsletters and confirmations.",
    );
  }
  const res = await fetch(`${GATEWAY_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": resendKey,
    },
    body: JSON.stringify({
      from: payload.from ?? FROM_DEFAULT,
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function mdToHtml(md: string): string {
  // small, conservative markdown → html for email bodies
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Extract fenced code blocks first so their contents aren't transformed.
  const codeBlocks: string[] = [];
  let src = md.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(
      `<pre style="background:#f5f3ee;padding:12px;border-radius:8px;overflow:auto;font-family:ui-monospace,monospace;font-size:13px"><code>${escape(code)}</code></pre>`,
    );
    return `\u0000CODE${codeBlocks.length - 1}\u0000`;
  });

  src = escape(src);

  // Block-level: lists
  src = src.replace(/(^|\n)((?:- .+\n?)+)/g, (_, lead, block: string) => {
    const items = block
      .trim()
      .split(/\n/)
      .map((l) => `<li>${l.replace(/^- /, "")}</li>`)
      .join("");
    return `${lead}<ul style="padding-left:20px;margin:8px 0">${items}</ul>`;
  });

  // Inline + headings
  src = src
    .replace(/^### (.*)$/gim, "<h3>$1</h3>")
    .replace(/^## (.*)$/gim, "<h2>$1</h2>")
    .replace(/^# (.*)$/gim, "<h1>$1</h1>")
    .replace(/`([^`]+)`/g, '<code style="background:#f5f3ee;padding:2px 6px;border-radius:4px">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#1F4D3A">$1</a>');

  // Paragraphs: split on blank lines, leave already-blocky chunks alone
  const html = src
    .split(/\n\n+/)
    .map((chunk) => {
      const t = chunk.trim();
      if (!t) return "";
      if (/^<(h1|h2|h3|ul|pre|p|blockquote)/i.test(t)) return t;
      return `<p>${t.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html.replace(/\u0000CODE(\d+)\u0000/g, (_, i) => codeBlocks[Number(i)]);
}

function wrapHtml(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
    <h1 style="font-family:Georgia,serif;color:#1F4D3A">${title}</h1>
    ${bodyHtml}
    <hr style="margin-top:32px;border:none;border-top:1px solid #eee" />
    <p style="font-size:12px;color:#888">Verdya — corporate sustainability hub</p>
  </body></html>`;
}

export const sendNewsletterCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        campaignId: z.string().uuid().optional(),
        subjectEn: z.string().min(1).max(200),
        subjectPt: z.string().min(1).max(200),
        bodyEn: z.string().min(1).max(50000),
        bodyPt: z.string().min(1).max(50000),
        testTo: z.string().email().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // Admin check
    const { data: isAdminRow } = await supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdminRow) throw new Error("Forbidden");

    if (data.testTo) {
      await sendViaResend({
        to: data.testTo,
        subject: `[TEST] ${data.subjectEn}`,
        html: wrapHtml(data.subjectEn, mdToHtml(data.bodyEn)),
      });
      return { ok: true, sent: 1, test: true };
    }

    const { data: subs, error: subErr } = await supabase
      .from("newsletter_subscribers")
      .select("email,language_pref")
      .is("unsubscribed_at", null);
    if (subErr) throw subErr;

    let sent = 0;
    const failed: string[] = [];
    for (const s of subs ?? []) {
      const isPt = s.language_pref === "pt";
      try {
        await sendViaResend({
          to: s.email,
          subject: isPt ? data.subjectPt : data.subjectEn,
          html: wrapHtml(
            isPt ? data.subjectPt : data.subjectEn,
            mdToHtml(isPt ? data.bodyPt : data.bodyEn),
          ),
        });
        sent += 1;
      } catch {
        failed.push(s.email);
      }
    }

    if (data.campaignId) {
      await supabase
        .from("newsletter_campaigns")
        .update({ sent_at: new Date().toISOString(), recipients_count: sent })
        .eq("id", data.campaignId);
    }

    return { ok: true, sent, failed };
  });

export const sendEventConfirmation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ eventId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [{ data: ev }, { data: profile }] = await Promise.all([
      supabase.from("events").select("*").eq("id", data.eventId).maybeSingle(),
      supabase.from("profiles").select("email,full_name").eq("id", userId).maybeSingle(),
    ]);
    if (!ev || !profile?.email) return { ok: false, skipped: true };

    const date = new Date(ev.starts_at).toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: ev.timezone || "UTC",
    });
    const html = wrapHtml(
      `You're registered: ${ev.title_en}`,
      `<p>Hi ${profile.full_name ?? "there"},</p>
       <p>You're confirmed for <strong>${ev.title_en}</strong> on <strong>${date}</strong> (${ev.timezone}).</p>
       ${ev.meeting_url ? `<p>Join link: <a href="${ev.meeting_url}">${ev.meeting_url}</a></p>` : ""}
       ${ev.location_detail ? `<p>Location: ${ev.location_detail}</p>` : ""}
       <p>See you there.</p>`,
    );
    try {
      await sendViaResend({ to: profile.email, subject: `Registered: ${ev.title_en}`, html });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: (err as Error).message };
    }
  });
