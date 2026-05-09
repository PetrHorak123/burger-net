import { unstable_noStore as noStore } from "next/cache";

export default function AnnouncementBar() {
  noStore(); // opt out of static rendering so env var is read at request time
  const message = process.env.ANNOUNCEMENT?.trim();
  if (!message) return null;
  return (
    <div className="print:hidden bg-amber-100 border-b border-amber-200 py-2 px-4 text-center text-sm text-amber-800 font-medium">
      {message}
    </div>
  );
}
