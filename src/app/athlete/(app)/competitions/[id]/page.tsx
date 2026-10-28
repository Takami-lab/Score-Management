import { redirect } from "next/navigation";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { getCompetition, listAthleteRoutineRows } from "@/lib/db/queries";
import { DInputForm } from "@/components/d-input-form";
import { ATHLETE_D_STATUSES, ATHLETE_E_STATUSES } from "@/lib/types";

export default async function AthleteDInputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const athlete = await getCurrentAthlete();
  if (!athlete) redirect("/athlete/login");
  const comp = await getCompetition(id);
  if (!comp) redirect("/athlete/competitions");
  const rows = await listAthleteRoutineRows(id, athlete.id);

  return (
    <DInputForm
      competitionId={id}
      athleteId={athlete.id}
      routineRows={rows}
      editable={ATHLETE_D_STATUSES.includes(comp.status)}
      editableE={ATHLETE_E_STATUSES.includes(comp.status)}
    />
  );
}
