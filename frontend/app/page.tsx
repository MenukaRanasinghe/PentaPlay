import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">🎮 Pentaplay Game Menu</h1>

      <ul className="list-disc pl-5 space-y-3">
        <li>
          <Link href="/snake-ladder" className="text-blue-600 underline">
            Snake & Ladder
          </Link>
        </li>
        <li>Traffic Simulation (coming soon)</li>
        <li>Travelling Salesman (coming soon)</li>
        <li>Tower of Hanoi (coming soon)</li>
        <li>Eight Queens (coming soon)</li>
      </ul>
    </main>
  );
}
