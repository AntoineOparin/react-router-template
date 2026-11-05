import { Form, useNavigation } from "react-router";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

import type { NoteErrors, NoteInput } from "../schema";

type NoteFormProps = {
  defaultValues?: Partial<NoteInput>;
  errors?: NoteErrors | null;
  submitLabel: string;
  /** Sent as the `intent` field so one route action can handle several buttons. */
  intent?: string;
};

export function NoteForm({ defaultValues, errors, submitLabel, intent }: NoteFormProps) {
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === "submitting" &&
    (intent === undefined || navigation.formData?.get("intent") === intent);

  return (
    <Form method="post" className="grid gap-4" noValidate>
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={defaultValues?.title}
          required
          maxLength={200}
          aria-invalid={Boolean(errors?.title)}
        />
        {errors?.title && <p className="text-sm text-destructive">{errors.title[0]}</p>}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="body">Note</Label>
        <Textarea
          id="body"
          name="body"
          rows={10}
          defaultValue={defaultValues?.body}
          aria-invalid={Boolean(errors?.body)}
        />
        {errors?.body && <p className="text-sm text-destructive">{errors.body[0]}</p>}
      </div>

      <div>
        <Button type="submit" name="intent" value={intent} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </Form>
  );
}
