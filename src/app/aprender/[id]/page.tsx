"use client";

import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Lesson } from "@/components/Lesson";
import { fetchBundle, type BundleItem } from "@/lib/content/bundle-client";

type Loaded = { status: "loading" } | { status: "error"; message: string } | { status: "ok"; item: BundleItem | null };

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loaded, setLoaded] = useState<Loaded>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchBundle()
      .then((b) => {
        if (!cancelled) setLoaded({ status: "ok", item: b.items.find((i) => i.id === id) ?? null });
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoaded({ status: "error", message: e instanceof Error ? e.message : "Error al cargar." });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      {loaded.status === "loading" && <p>Cargando...</p>}
      {loaded.status === "error" && <p>{loaded.message}</p>}
      {loaded.status === "ok" &&
        (loaded.item ? (
          <Lesson item={loaded.item} onContinue={() => router.push("/")} />
        ) : (
          <p>No encontrado</p>
        ))}
    </main>
  );
}
