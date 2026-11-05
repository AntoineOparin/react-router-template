import { Form, Link, useNavigation } from "react-router";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import type { CredentialsErrors } from "../schema";

type AuthFormProps = {
  mode: "login" | "signup";
  errors?: CredentialsErrors | null;
  message?: string;
  redirectTo?: string;
};

const copy = {
  login: {
    title: "Log in",
    description: "Welcome back.",
    submit: "Log in",
    switchText: "No account yet?",
    switchLink: { to: "/auth/signup", label: "Sign up" },
  },
  signup: {
    title: "Create an account",
    description: "Sign up with your email and a password.",
    submit: "Sign up",
    switchText: "Already have an account?",
    switchLink: { to: "/auth/login", label: "Log in" },
  },
} as const;

export function AuthForm({ mode, errors, message, redirectTo }: AuthFormProps) {
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const t = copy[mode];

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <p className="text-sm">{message}</p>
        ) : (
          <Form method="post" className="grid gap-4" noValidate>
            {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={Boolean(errors?.email)}
              />
              {errors?.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "login" && (
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                aria-invalid={Boolean(errors?.password)}
              />
              {errors?.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
            </div>

            {errors?.form && <p className="text-sm text-destructive">{errors.form[0]}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait…" : t.submit}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t.switchText}{" "}
              <Link to={t.switchLink.to} className="underline underline-offset-4">
                {t.switchLink.label}
              </Link>
            </p>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
