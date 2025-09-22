# Page snapshot

```yaml
- heading "Welcome Back" [level=1]
- paragraph: Sign in to your account to continue
- text: Email Address*
- textbox "Email Address*"
- text: Password*
- textbox "Password*"
- button "Sign In"
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /signup
- link "Forgot your password?":
  - /url: /forgot-password
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- button "Collapse issues badge":
  - img
```