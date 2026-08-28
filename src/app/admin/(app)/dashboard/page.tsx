import { listCompetitions } from "@/lib/db/queries";
import { createCompetition } from "@/lib/actions/competitions";
import { Calendar } from "@/components/calendar";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardBody, CardTitle, Input, Label } from "@/components/ui";
import { todayJst } from "@/lib/time";

export default async function DashboardPage() {
  const competitions = await listCompetitions();
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardBody>
            <CardTitle>試技会カレンダー</CardTitle>
            <Calendar competitions={competitions} />
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <CardTitle>新規作成</CardTitle>
            <ActionForm action={createCompetition} successMessage="">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">名称</Label>
                  <Input id="name" name="name" required placeholder="◯◯記録会" />
                </div>
                <div>
                  <Label htmlFor="held_on">日付</Label>
                  <Input id="held_on" name="held_on" type="date" defaultValue={todayJst()} required />
                </div>
                <div>
                  <Label htmlFor="venue">会場</Label>
                  <Input id="venue" name="venue" placeholder="市体育館" />
                </div>
                <SubmitButton className="w-full">作成して設定へ</SubmitButton>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
