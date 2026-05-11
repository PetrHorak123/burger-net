import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import CountdownClient from "@/components/CountdownClient";

export default function Home() {
  noStore();
  const enabled = process.env.COUNTDOWN_ENABLED === "true";
  const eventDate = process.env.EVENT_DATE ?? "2026-05-13T17:00:00+02:00";

  if (!enabled || Date.now() >= new Date(eventDate).getTime()) {
    redirect("/leaderboard");
  }

  return <CountdownClient eventDate={eventDate} />;
}
