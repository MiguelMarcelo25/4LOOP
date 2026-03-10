export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { Resend } from "resend";

// 📨 Helper function
async function sendNotificationEmail(to, subject, body) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: "Pasig Sanitation <noreply@pasigsanitation-project.site>",
      to: Array.isArray(to) ? to : [to], // ✅ ensure array
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
          <h2 style="color: #004AAD; margin-bottom: 10px;">${subject}</h2>
          <div>${body}</div>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 13px; color: #777;">
            This is an automated message from <strong>Pasig Sanitation</strong>. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log("📧 Resend API response:", result);
    return result;
  } catch (err) {
    console.error("❌ Resend sendNotificationEmail error:", err);
    throw err;
  }
}

// 🔹 POST — Send Notification Email
export async function POST(request) {
  try {
    const { to, subject, body } = await request.json();

    // ✅ Validation
    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "Missing required fields (to, subject, body)." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("🚫 Missing RESEND_API_KEY environment variable.");
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 }
      );
    }

    // ✅ Sanitize body
    const safeBody =
      body.trim().startsWith("<") && body.trim().endsWith(">")
        ? body
        : `<p>${body}</p>`;

    // ✅ Send
    const result = await sendNotificationEmail(to, subject, safeBody);

    if (result?.error) {
      console.error("❌ Resend API error:", result.error);
      return NextResponse.json(
        { error: "Resend API request failed", details: result.error },
        { status: 502 }
      );
    }

    console.log(`✅ Email sent successfully to ${to}`);
    return NextResponse.json({ msg: "✅ Email sent successfully." }, { status: 200 });
  } catch (error) {
    console.error("📨 Email sending error:", error);
    return NextResponse.json(
      { error: "Failed to send email.", details: error.message },
      { status: 500 }
    );
  }
}
