import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAdmin } from "@/lib/auth/admin";
import { getCurrentAthlete } from "@/lib/auth/athlete";
import { getCompetitionResults } from "@/lib/db/results";
import { buildResultsCsv } from "@/lib/csv";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> },
) {
  const { competitionId } = await params;

  const admin = await getCurrentAdmin();
  const athlete = admin ? null : await getCurrentAthlete();
  if (!admin && !athlete) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const data = await getCompetitionResults(competitionId);
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!admin && data.competition.status === "draft") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const csv = buildResultsCsv(
    data.competition.name,
    data.competition.held_on,
    data.provisional,
    data.results,
  );

  const filename = `results_${data.competition.held_on}.csv`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
