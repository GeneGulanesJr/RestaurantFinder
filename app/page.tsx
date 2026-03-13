import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionCookieName, verifySession } from "@/lib/session";
import SearchUI from "./components/SearchUI";

export default async function Home() {
  const cookieStore = await cookies();
  const value = cookieStore.get(getSessionCookieName())?.value;
  const user = verifySession(value);
  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8">
      <SearchUI />
    </main>
  );
}
