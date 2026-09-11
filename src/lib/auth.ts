import CredentialsProvider from "next-auth/providers/credentials";
import NetlifyProvider from "next-auth/providers/netlify";
import EmailProvider from "next-auth/providers/email";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import client from "@/src/lib/db";
import { NextAuthOptions } from "next-auth";
import { ExtendedAdapterUser } from "../types/model/ExtendedAdapterUser";
import { EmailConfig } from "next-auth/providers/index";
import nodemailer from "nodemailer";

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(client, {
    databaseName: process.env.MONGODB_AUTH_DB_NAME,
  }),
  pages: {
    signIn: "/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { username, password } = credentials;
        const res = await fetch(
          `${process.env.NEXTAUTH_URL}/getUserByLoginWithCredentials`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          },
        );
        const data = await res.json();
        if (res.ok && data.success) {
          const userId = data.user._id;
          const adapterUser = data.user as ExtendedAdapterUser;
          adapterUser.id = userId;
          return adapterUser;
        }
        return null;
      },
    }),
    // ...add more providers here
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "0"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM, // địa chỉ gửi mail, ví dụ: "noreply@yourapp.com"
      sendVerificationRequest, // hàm gửi email xác minh
    }),
    NetlifyProvider({
      clientId: process.env.NETLIFY_ID || "",
      clientSecret: process.env.NETLIFY_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Cho phép liên kết tài khoản Google với email đã tồn tại
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Cho phép liên kết tài khoản Google với email đã tồn tại
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      allowDangerousEmailAccountLinking: true, // Cho phép liên kết tài khoản GitHub với email đã tồn tại
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const adapterUser = user as ExtendedAdapterUser;
        token.id = adapterUser.id;
        token.name = `${adapterUser.firstName} ${adapterUser.lastName}`;
        token.email = adapterUser.email;
        token.picture = adapterUser.image;
        token.username = adapterUser.username;
        token.emailVerified = adapterUser.emailVerified;
      }

      // Merge new data into the token when session.update() is called from the client
      if (trigger === "update" && session) {
        if (session.image) {
          token.picture = session.image; // NextAuth stores avatar url under "picture" internally
        }
        if (session.name) {
          token.name = session.name;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.username = token.username;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const expiresInMinutesForCode = 15; // Expiration time in minute for email confirmation code

//#region "User Deletion Confirm Code"
/**
 * Generates a 6-digit account deletion confirmation code and emails it to the user.
 *
 * Looks up the "email" provider config from `authOptions` to reuse its SMTP
 * transport and "from" address, generates a random 6-digit code, then sends
 * it via nodemailer using the deletion-confirmation email template.
 *
 * @param params - The request payload.
 * @param params.identifier - The recipient's email address.
 * @param params.url - The base URL used to derive the display host shown in the email.
 * @returns A promise that resolves once the email has been sent successfully.
 * @throws {Error} If the "email" provider is not configured in `authOptions`.
 * @throws {Error} If the email fails to send (rejected or left pending by the SMTP server).
 */
export async function sendUserDeletionConfirmCode({
  code,
  identifier,
  url,
}: {
  code: string;
  identifier: string;
  url: string;
}) {
  const { host } = new URL(url);
  const emailConfig = authOptions.providers.find((o) => o.id === "email") as
    | EmailConfig
    | undefined;
  if (!emailConfig) {
    throw new Error(`Invalid email config`);
  }
  const transport = nodemailer.createTransport(emailConfig.server);
  const result = await transport.sendMail({
    to: identifier,
    from: emailConfig.from,
    subject: `Sign in to ${host}`,
    text: `Your account deletion code is ${code}. This code expires in ${expiresInMinutesForCode} minutes.\n\nIf you did not request this, please ignore this email.`,
    html: htmlUserDeletionConfirmCode({
      code,
      host,
      expiresInMinutes: expiresInMinutesForCode,
    }),
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
function htmlUserDeletionConfirmCode(params: {
  code: string;
  host: string;
  expiresInMinutes: number;
}) {
  const { code, host, expiresInMinutes } = params;

  const escapedHost = host.replace(/\./g, "&#8203;.");

  const brandColor = "#346df1";
  const color = {
    background: "#f9f9f9",
    mainBackground: "#fff",
    text: "#444",
    mutedText: "#888",
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: "#fff",
    dangerBackground: "#fee2e2", // nền icon cảnh báo, màu đỏ nhạt
    codeBackground: "#f8fafc", // nền khối chứa mã
    codeBorder: "#e2e8f0", // viền khối chứa mã
  };

  const mutedText = color.mutedText || "#8a8f98";

  return `
<body style="margin: 0; padding: 0; background: ${color.background}; font-family: Helvetica, Arial, sans-serif;">
  <!-- Preheader: hiện trong preview inbox nhưng ẩn khi mở mail -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    Your account deletion code is ${code}. This code expires in ${expiresInMinutes} minutes.
  </div>

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: ${color.background}; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0"
          style="max-width: 480px; background: ${color.mainBackground}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

          <!-- Icon warning circle -->
          <tr>
            <td align="center" style="padding: 40px 32px 0 32px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" valign="middle"
                    style="width: 56px; height: 56px; border-radius: 50%; background: ${color.dangerBackground};">
                    <span style="font-size: 24px; line-height: 56px;">&#9888;&#65039;</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding: 20px 32px 0 32px; font-size: 20px; font-weight: 700; color: ${color.text};">
              Confirm account deletion
            </td>
          </tr>

          <!-- Description -->
          <tr>
            <td align="center" style="padding: 12px 32px 0 32px; font-size: 15px; line-height: 22px; color: ${mutedText};">
              Enter the code below on ${escapedHost} to permanently delete your account.<br />This action cannot be undone.
            </td>
          </tr>

          <!-- 6 digit code -->
          <tr>
            <td align="center" style="padding: 28px 32px 0 32px;">
              <table border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center"
                    style="background: ${color.codeBackground}; border: 1px solid ${color.codeBorder}; border-radius: 12px; padding: 18px 36px;">
                    <span style="font-size: 34px; font-weight: 700; letter-spacing: 10px; color: ${color.text}; font-family: 'Courier New', Courier, monospace;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiration -->
          <tr>
            <td align="center" style="padding: 16px 32px 0 32px; font-size: 13px; color: ${mutedText};">
              This code expires in ${expiresInMinutes} minutes.
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 32px 32px 0 32px;">
              <div style="border-top: 1px solid rgba(0,0,0,0.08);"></div>
            </td>
          </tr>

          <!-- Security warning -->
          <tr>
            <td align="center" style="padding: 20px 32px 0 32px; font-size: 13px; line-height: 20px; color: ${mutedText};">
              If you did not request to delete your account, please ignore this email and consider changing your password — someone may be trying to access your account.
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 12px 32px 40px 32px; font-size: 13px; line-height: 20px; color: ${mutedText};">
              Never share this code with anyone. Our team will never ask you for it.
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
//#endregion

//#region "Verification Email Request"
/**
 * Sends a sign-in verification email containing a magic link to the user.
 *
 * Called internally by NextAuth's EmailProvider whenever a user requests
 * a passwordless sign-in link. Builds the HTML email body and dispatches
 * it through the configured SMTP transport.
 *
 * @param params - The verification request payload provided by NextAuth.
 * @param params.identifier - The recipient's email address.
 * @param params.url - The one-time sign-in URL to embed in the email.
 * @param params.provider - The EmailProvider configuration (server, from, etc.).
 * @param params.theme - The NextAuth theme object (colors, brand info) used to style the email.
 * @returns A promise that resolves once the email has been sent.
 * @throws Will throw if the SMTP transport fails to send the email.
 */
export async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
  provider: any;
  theme: any;
}) {
  const { identifier, url, provider, theme } = params;
  const { host } = new URL(url);
  // NOTE: You are not required to use `nodemailer`, use whatever you want.
  const transport = nodemailer.createTransport(provider.server);
  const result = await transport.sendMail({
    to: identifier,
    from: provider.from,
    subject: `Sign in to ${host}`,
    text: `Sign in to ${host}\n${url}\n\n`,
    html: htmlSendVerificationRequest({ url, host, theme }),
  });
  const failed = result.rejected.filter(Boolean);
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
function htmlSendVerificationRequest(params: {
  url: string;
  host: string;
  theme: any;
}) {
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
//#endregion
