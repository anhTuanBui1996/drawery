export default async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
  provider: any;
  theme: any;
}) {
  const nodemailer = require("nodemailer");
  const { identifier, url, provider, theme } = params;
  const { host } = new URL(url);
  // NOTE: You are not required to use `nodemailer`, use whatever you want.
  const transport = nodemailer.createTransport(provider.server);
  const result = await transport.sendMail({
    to: identifier,
    from: provider.from,
    subject: `Sign in to ${host}`,
    text: text({ url, host }),
    html: html({ url, host, theme }),
  });
  const failed = result.rejected.concat(result.pending).filter(Boolean);
  if (failed.length) {
    throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
  }
}

/**
 * Email HTML body
 * Insert invisible space into domains from being turned into a hyperlink by email
 * clients like Outlook and Apple mail, as this is confusing because it seems
 * like they are supposed to click on it to sign in.
 *
 * @note We don't add the email address to avoid needing to escape it, if you do, remember to sanitize it!
 */
function html(params: { url: string; host: string; theme: any }) {
  const { url, host, theme } = params;

  const escapedHost = host.replace(/\./g, "&#8203;.");

  const brandColor = theme.brandColor || "#346df1";
  const color = {
    background: "#f9f9f9",
    mainBackground: "#fff",
    text: "#444",
    mutedText: "#888",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: theme.buttonText || "#fff",
  };

  const mutedText = color.mutedText || "#8a8f98";

  return `
<body style="margin: 0; padding: 0; background: ${color.background}; font-family: Helvetica, Arial, sans-serif;">
  <!-- Preheader: hiện trong preview inbox nhưng ẩn khi mở mail -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    Use this link to securely sign in to ${escapedHost}. This link expires in 24 hours.
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: ${color.background}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0"
          style="max-width: 480px; background: ${color.mainBackground}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

          <!-- Icon tròn -->
          <tr>
            <td align="center" style="padding: 40px 32px 0 32px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" valign="middle"
                    style="width: 56px; height: 56px; border-radius: 50%; background: ${color.buttonBackground};">
                    <span style="font-size: 24px; line-height: 56px;">&#128274;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Tiêu đề -->
          <tr>
            <td align="center" style="padding: 20px 32px 0 32px; font-size: 20px; font-weight: 700; color: ${color.text};">
              Sign in to ${escapedHost}
            </td>
          </tr>

          <!-- Mô tả -->
          <tr>
            <td align="center" style="padding: 12px 32px 0 32px; font-size: 15px; line-height: 22px; color: ${mutedText};">
              Click the button below to securely sign in.<br />This link will expire in 24 hours.
            </td>
          </tr>

          <!-- Nút CTA -->
          <tr>
            <td align="center" style="padding: 28px 32px 0 32px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" bgcolor="${color.buttonBackground}"
                    style="border-radius: 8px; border: 1px solid ${color.buttonBorder};">
                    <a href="${url}" target="_blank"
                      style="display: inline-block; padding: 13px 32px; font-size: 16px; font-weight: 700;
                             color: ${color.buttonText}; text-decoration: none; border-radius: 8px;">
                      Sign in &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td align="center" style="padding: 24px 32px 0 32px; font-size: 12px; line-height: 18px; color: ${mutedText};">
              Or copy and paste this link into your browser:
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 6px 32px 0 32px; font-size: 12px; word-break: break-all;">
              <a href="${url}" target="_blank" style="color: ${color.buttonBackground}; text-decoration: underline;">${url}</a>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <div style="border-top: 1px solid rgba(0,0,0,0.08);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 32px 40px 32px; font-size: 13px; line-height: 20px; color: ${mutedText};">
              If you did not request this email, you can safely ignore it.
            </td>
          </tr>
        </table>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 480px;">
          <tr>
            <td align="center" style="padding: 20px 0; font-size: 12px; color: ${mutedText};">
              &copy; ${new Date().getFullYear()} ${escapedHost}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
`;
}

/** Email Text body (fallback for email clients that don't render HTML, e.g. feature phones) */
function text({ url, host }: { url: string; host: string }) {
  return `Sign in to ${host}\n${url}\n\n`;
}
