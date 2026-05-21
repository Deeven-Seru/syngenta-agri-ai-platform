import SuperTokens from "supertokens-auth-react";
import EmailPassword from "supertokens-auth-react/recipe/emailpassword";
import Session from "supertokens-auth-react/recipe/session";

export function initSuperTokens() {
  SuperTokens.init({
    appInfo: {
      appName: "Syngenta Command Center",
      apiDomain: import.meta.env.VITE_API_URL || "http://localhost:8080",
      websiteDomain: import.meta.env.VITE_WEBSITE_URL || window.location.origin,
      apiBasePath: "/auth",
      websiteBasePath: "/auth"
    },
    recipeList: [
      EmailPassword.init({
        style: `
          [data-supertokens~=container] {
            --palette-background: #0a0f0c; /* var(--bg-panel) */
            --palette-inputBackground: #030504; /* var(--bg-base) */
            --palette-inputBorder: rgba(0, 255, 102, 0.2); /* var(--border) */
            --palette-textTitle: #f0fff5; /* var(--text-1) */
            --palette-textLabel: #a3ccb3; /* var(--text-2) */
            --palette-textPrimary: #f0fff5;
            --palette-error: #ff3333;
            --palette-primary: #00ff66; /* var(--accent) */
            --palette-primaryBorder: #00ff66;
            font-family: 'Inter', sans-serif;
            border: 1px solid rgba(0, 255, 102, 0.2);
            box-shadow: 0 4px 24px rgba(0, 255, 102, 0.08);
            backdrop-filter: blur(12px);
          }
          [data-supertokens~=button] {
            background: rgba(0, 255, 102, 0.1);
            color: #33ff85;
            border: 1px solid #33ff85;
            box-shadow: 0 0 10px rgba(0, 255, 102, 0.25);
            transition: all 0.2s ease;
          }
          [data-supertokens~=button]:hover {
            background: #33ff85;
            color: #000;
            box-shadow: 0 0 15px rgba(0, 255, 102, 0.4);
          }
          [data-supertokens~=headerTitle] {
            font-family: 'Geist Mono', monospace;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        `
      }),
      Session.init()
    ]
  });
}
