"use client";

import { PrivateModeNotice } from "@/components/PrivateModeNotice";
import { SessionRunner } from "@/components/SessionRunner";
import { useAppData } from "@/components/useAppData";

export default function SessionPage() {
  const data = useAppData();
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      {data.status === "loading" && <p>Cargando...</p>}
      {data.status === "error" && <p>{data.message}</p>}
      {data.status === "ok" && (
        <>
          {!data.persistent && <PrivateModeNotice />}
          <SessionRunner bundle={data.bundle} store={data.store} />
        </>
      )}
    </main>
  );
}
