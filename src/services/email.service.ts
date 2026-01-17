const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY is not set in .env file!");
  throw new Error("SENDGRID_API_KEY is required");
}

export const emailService = {
  async sendRegistrationEmail(email: string, code: string) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: {
          email: "dinmukhamed.amirov@gmail.com",
          name: "Registration",
        },
        subject: "register",
        content: [
          {
            type: "text/html",
            value: `<h1>Thank for your registration</h1>
<p>To finish registration please follow the link below:
    <a href='https://somesite.com/confirm-email?code=${code}'>complete registration</a>
</p>`,
          },
        ],
        tracking_settings: {
          click_tracking: { enable: false, enable_text: false },
          open_tracking: { enable: false },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ SendGrid error:", errorText);
      throw new Error(
        `Email sending failed: ${response.status} - ${errorText}`
      );
    }
  },

  async sendPasswordRecovery(email: string, code: string) {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: {
          email: "dinmukhamed.amirov@gmail.com",
          name: "Recovery password",
        },
        subject: "Recovery Password",
        content: [
          {
            type: "text/html",
            value: `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${code}'>recovery password</a>
      </p>`,
          },
        ],
        tracking_settings: {
          click_tracking: { enable: false, enable_text: false },
          open_tracking: { enable: false },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ SendGrid error:", errorText);
      throw new Error(
        `Email sending failed: ${response.status} - ${errorText}`
      );
    }
  },
};
