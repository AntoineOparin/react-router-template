import { Form, useNavigation } from "react-router";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

import type { NewPasswordErrors } from "../schema";

type ResetPasswordFormProps = {
  errors?: NewPasswordErrors | null;
};

export function ResetPasswordForm({ errors }: ResetPasswordFormProps) {
  const isSubmitting = useNavigation().state === "submitting";

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
        <CardDescription>You'll stay signed in after saving it.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form method="post" className="grid gap-4" noValidate>
          <div className="grid gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(errors?.password)}
            />
            {errors?.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              aria-invalid={Boolean(errors?.confirmPassword)}
            />
            {errors?.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword[0]}</p>
            )}
          </div>
          {errors?.form && <p className="text-sm text-destructive">{errors.form[0]}</p>}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save new password"}
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
