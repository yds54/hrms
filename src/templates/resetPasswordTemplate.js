require("dotenv").config();
const moment = require("moment");

const resetPasswordTemplate = (resetUrl) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Reset Password</title>
</head>

<body
style="
margin:0;
padding:0;
background:#f3f4f6;
font-family:Arial,Helvetica,sans-serif;
"
>

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:40px 20px;">

<table
width="600"
cellpadding="0"
cellspacing="0"
border="0"
style="
background:#ffffff;
border-radius:16px;
overflow:hidden;
box-shadow:0 4px 20px rgba(0,0,0,0.08);
"
>

<!-- Logo -->
<tr>
<td align="center" style="padding:40px 40px 20px;">

<img
src="${process.env.COMPANY_LOGO_URL}"
alt="Bigscal Logo"
width="100"
style="
display:block;
max-width:100px;
height:auto;
"
/>

</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:10px 50px 40px;">

<h1
style="
margin:0 0 20px;
font-size:28px;
font-weight:700;
color:#111827;
text-align:center;
"
>
Reset Password
</h1>

<p
style="
font-size:16px;
line-height:1.7;
color:#4b5563;
text-align:center;
margin:0 0 30px;
"
>
We received a request to reset the password for your account.
Click the button below to create a new password.
</p>

<!-- CTA Button -->
<div style="text-align:center;margin:35px 0;">

<a
href="${resetUrl}"
target="_blank"
style="
background:#2563eb;
color:#ffffff;
padding:14px 32px;
border-radius:8px;
font-size:16px;
font-weight:600;
text-decoration:none;
display:inline-block;
"
>
Reset Password
</a>

</div>

<!-- Security Box -->
<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
background:#f9fafb;
border:1px solid #e5e7eb;
border-radius:8px;
"
>
<tr>
<td style="padding:16px;">

<p
style="
margin:0;
font-size:14px;
color:#374151;
line-height:1.6;
"
>
This password reset link will expire in
<strong>15 minutes</strong>.
</p>

</td>
</tr>
</table>

<p
style="
margin-top:25px;
font-size:14px;
color:#6b7280;
line-height:1.7;
"
>
If you didn't request a password reset, you can safely ignore this email.
Your password will remain unchanged.
</p>

<!-- Help Box -->
<table
width="100%"
cellpadding="0"
cellspacing="0"
style="
margin-top:30px;
background:#eff6ff;
border:1px solid #bfdbfe;
border-radius:8px;
"
>
<tr>
<td style="padding:18px;">
<p
style="
margin:0 0 8px;
font-size:14px;
font-weight:600;
color:#1e40af;
"
>
Security Notice
</p>

<p
style="
margin:0;
font-size:13px;
line-height:1.7;
color:#475569;
"
>
For security reasons, this password reset link is valid for only
15 minutes and can be used once. If you did not request a password
reset, no further action is required.
</p>

</td>
</tr>
</table>

</td>
</tr>

<!-- Footer -->
<tr>
<td
align="center"
style="
padding:24px;
background:#fafafa;
border-top:1px solid #e5e7eb;
"
>

<p
  style="
  margin:0;
  font-size:12px;
  color:#6b7280;
  line-height:1.8;
  "
>
  © ${moment().year()}
  <a
    href="https://www.bigscal.com/"
    target="_blank"
    style="
      color:#2563eb;
      text-decoration:none;
      font-weight:500;
    "
  >
    Bigscal Technologies Pvt. Ltd.
  </a>
  <br />
  All rights reserved.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`;

module.exports = resetPasswordTemplate;
