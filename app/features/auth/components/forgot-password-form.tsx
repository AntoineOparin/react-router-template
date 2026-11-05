import { Form, Link, useNavigation } from "react-router";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { FieldErrors } from "~/lib/forms";

type ForgotPasswordFormProps = {
  errors?: FieldErrors<{ email: string }> | null;
  /** Shown instead of the form once the request was sent. */
  message?: string;
};

export function ForgotPasswordForm({ errors, message }: ForgotPasswordFormProps) {
  const isSubmitting = useNavigation().state === "submitting";

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We'll email you a link to choose a new password.</CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <p className="text-sm">{message}</p>
        ) : (
          <Form method="post" className="grid gap-4" noValidate>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link to="/auth/login" className="underline underline-offset-4">
                Back to log in
              </Link>
            </p>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
