import { listAllAthletes } from "@/lib/db/queries";
import { RosterManager } from "@/components/roster";

export default async function AthletesPage() {
  const athletes = await listAllAthletes();
  return <RosterManager athletes={athletes} />;
}
