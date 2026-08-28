import { notFound } from "next/navigation";
import {
  getCompetition,
  listActiveAthletes,
  listEntryAthletes,
} from "@/lib/db/queries";
import { updateCompetition } from "@/lib/actions/competitions";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardBody, CardTitle, Input, Label } from "@/components/ui";
import { EntriesEditor } from "@/components/entries-editor";
import { StatusEditor } from "@/components/status-editor";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comp = await getCompetition(id);
  if (!comp) notFound();
  const [athletes, entered] = await Promise.all([
    listActiveAthletes(),
    listEntryAthletes(id),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <CardTitle>日程・会場</CardTitle>
          <ActionForm action={updateCompetition}>
            <input type="hidden" name="id" value={id} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <Label>名称</Label>
                <Input name="name" defaultValue={comp.name} required />
              </div>
              <div>
                <Label>日付</Label>
                <Input name="held_on" type="date" defaultValue={comp.held_on} required />
              </div>
              <div className="sm:col-span-2">
                <Label>会場</Label>
                <Input name="venue" defaultValue={comp.venue ?? ""} />
              </div>
            </div>
            <div className="mt-3">
              <SubmitButton>保存</SubmitButton>
            </div>
          </ActionForm>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle>参加者</CardTitle>
          <EntriesEditor
            competitionId={id}
            athletes={athletes}
            enteredIds={entered.map((a) => a.id)}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <CardTitle>ステータス</CardTitle>
          <StatusEditor competitionId={id} current={comp.status} />
        </CardBody>
      </Card>
    </div>
  );
}
