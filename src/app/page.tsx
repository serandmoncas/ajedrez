import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-6 p-6">
      <h1 className="text-3xl font-bold">Ajedrez</h1>
      <p className="text-[var(--subtle)]">
        Entrenador diario de ajedrez: repaso, patrones, aperturas y partidas.
      </p>
      <Link
        href="/sesion"
        className="rounded-lg bg-[var(--accent)] px-4 py-3 text-center font-semibold text-white"
      >
        Empezar sesión
      </Link>
      <nav className="flex justify-center gap-6">
        <Link href="/capacidades" className="underline">
          Capacidades
        </Link>
        <Link href="/ajustes" className="underline">
          Ajustes
        </Link>
        <Link href="/creditos" className="underline">
          Créditos
        </Link>
      </nav>
    </main>
  );
}
