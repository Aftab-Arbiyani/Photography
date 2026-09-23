/**
 * Minimal inline HTML email templates. Kept dependency-free for Phase 1;
 * a templating engine (MJML / Handlebars) can replace these later without
 * touching MailService.
 */

const wrapper = (title: string, body: string): string => `
<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f5f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d1d1f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;">
          <tr><td style="padding:40px 40px 8px;font-size:22px;font-weight:600;letter-spacing:-0.5px;">${title}</td></tr>
          <tr><td style="padding:8px 40px 40px;font-size:15px;line-height:1.6;color:#333;">${body}</td></tr>
        </table>
        <p style="margin:24px 0 0;font-size:11px;color:#7a7a7a;">Aperture — Photography Platform</p>
      </td></tr>
    </table>
  </body>
</html>`;

const button = (url: string, label: string): string => `
  <a href="${url}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#0066cc;color:#fff;text-decoration:none;border-radius:9999px;font-size:15px;">${label}</a>`;

export const verificationTemplate = (name: string, url: string): string =>
  wrapper(
    'Confirm your email',
    `<p>Hi ${name},</p>
     <p>Welcome to Aperture. Please confirm your email address to activate your account.</p>
     ${button(url, 'Verify email')}
     <p style="font-size:13px;color:#7a7a7a;">If the button doesn't work, copy this link:<br/>${url}</p>`,
  );

export const passwordResetTemplate = (name: string, url: string): string =>
  wrapper(
    'Reset your password',
    `<p>Hi ${name},</p>
     <p>We received a request to reset your password. This link expires in 1 hour.</p>
     ${button(url, 'Reset password')}
     <p style="font-size:13px;color:#7a7a7a;">If you didn't request this, you can safely ignore this email.</p>`,
  );

export const welcomeTemplate = (name: string, url: string): string =>
  wrapper(
    'Welcome to Aperture',
    `<p>Hi ${name},</p>
     <p>Your email is verified and your account is ready. Explore the gallery and start curating.</p>
     ${button(url, 'Open Aperture')}`,
  );

// ---- marketplace transactional emails ----

export interface OrderEmailLine {
  title: string;
  licenseType: string;
  unitPriceCents: number;
}

export interface OrderEmailData {
  invoiceNumber: string;
  totalCents: number;
  currency: string;
  lines: OrderEmailLine[];
}

const money = (cents: number, currency: string): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(
    cents / 100,
  );

const lineRows = (order: OrderEmailData): string =>
  order.lines
    .map(
      (l) =>
        `<tr>
           <td style="padding:6px 0;color:#333;">${l.title} <span style="color:#7a7a7a;">(${l.licenseType})</span></td>
           <td style="padding:6px 0;text-align:right;color:#1d1d1f;">${money(l.unitPriceCents, order.currency)}</td>
         </tr>`,
    )
    .join('');

export const purchaseSuccessTemplate = (name: string, order: OrderEmailData, url: string): string =>
  wrapper(
    'Thank you for your purchase',
    `<p>Hi ${name},</p>
     <p>Your order <strong>${order.invoiceNumber}</strong> is confirmed. Your downloads are ready in your dashboard.</p>
     <table role="presentation" width="100%" style="margin:16px 0;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;">
       ${lineRows(order)}
       <tr><td style="padding:10px 0;font-weight:600;">Total</td>
           <td style="padding:10px 0;text-align:right;font-weight:600;">${money(order.totalCents, order.currency)}</td></tr>
     </table>
     ${button(url, 'Go to my downloads')}`,
  );

export const invoiceTemplate = (name: string, order: OrderEmailData, url: string): string =>
  wrapper(
    `Invoice ${order.invoiceNumber}`,
    `<p>Hi ${name},</p>
     <p>Here is your invoice for order <strong>${order.invoiceNumber}</strong>.</p>
     <table role="presentation" width="100%" style="margin:16px 0;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0;">
       ${lineRows(order)}
       <tr><td style="padding:10px 0;font-weight:600;">Total paid</td>
           <td style="padding:10px 0;text-align:right;font-weight:600;">${money(order.totalCents, order.currency)}</td></tr>
     </table>
     ${button(url, 'View invoice')}`,
  );

export const downloadReadyTemplate = (name: string, albumTitle: string, url: string): string =>
  wrapper(
    'Your download is ready',
    `<p>Hi ${name},</p>
     <p>Your files for <strong>${albumTitle}</strong> are ready to download.</p>
     ${button(url, 'Download now')}
     <p style="font-size:13px;color:#7a7a7a;">Download links are time-limited and tied to your account.</p>`,
  );

export const orderFailedTemplate = (name: string, invoiceNumber: string, url: string): string =>
  wrapper(
    'Payment could not be completed',
    `<p>Hi ${name},</p>
     <p>We couldn't process the payment for order <strong>${invoiceNumber}</strong>. No charge was made.</p>
     ${button(url, 'Try again')}`,
  );
