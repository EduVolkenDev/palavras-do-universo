# Auth email templates

Authentication email links cannot be sent through a provider that rewrites URLs for click
tracking. Brevo's transactional tracking redirects authentication links through its own domain,
which breaks Supabase confirmation URLs when the tracking service is unavailable.

Palavras do Universo uses email OTPs instead. Configure the following templates in the Supabase
dashboard at **Authentication > Email Templates**:

- **Confirm signup**: use `{{ .Token }}` and do not include `{{ .ConfirmationURL }}`.
- **Magic Link**: use `{{ .Token }}` and do not include `{{ .ConfirmationURL }}`.
- **Reset password**: use `{{ .Token }}` and do not include `{{ .ConfirmationURL }}`.

Use this body for the Magic Link template. The confirmation and recovery templates should keep the
same structure with their own subject and heading.

```html
<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f6efe4;color:#241b18;font-family:Arial,sans-serif">
    <main style="max-width:560px;margin:0 auto;padding:40px 24px">
      <p style="margin:0 0 12px;color:#8a6b3f;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">
        Palavras do Universo
      </p>
      <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:34px;line-height:1.12">
        Seu código de acesso
      </h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.6">
        Digite este código na página de entrada para abrir seu Universo.
      </p>
      <p style="margin:0 0 24px;padding:18px 20px;border:1px solid #d8c3a6;background:#fffaf2;font-size:28px;font-weight:700;letter-spacing:8px;text-align:center">
        {{ .Token }}
      </p>
      <p style="margin:0;color:#6f615a;font-size:13px;line-height:1.6">
        Este código expira em breve e só deve ser usado por você. Se não solicitou este acesso,
        ignore este e-mail.
      </p>
    </main>
  </body>
</html>
```

If the Brevo plan allows transactional click tracking to be disabled, keep it disabled. The
**Anonymous email tracking** option is not a substitute and should remain set to **No**: it only
anonymizes metrics and can still rewrite links. OTP templates contain no authentication URL to
rewrite, so they remain reliable even when that Brevo setting is unavailable.
