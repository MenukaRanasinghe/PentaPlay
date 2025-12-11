import Link from "next/link";

export default function Home() {
  return (
    <main className="p-8 bg-white text-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">🎮 Pentaplay Menu</h1>
      <ul className="list-disc pl-5 space-y-3">
        <li>
          <Link className="text-blue-600 underline" href="/snake-ladder">
            Snake &amp; Ladder
          </Link>
        </li>
        <li className="text-gray-500">Traffic Simulation (coming soon)</li>
        <li className="text-gray-500">Travelling Salesman (coming soon)</li>
        <li className="text-gray-500">Tower of Hanoi (coming soon)</li>
        <li className="text-gray-500">Eight Queens (coming soon)</li>
      </ul>
    </main>
  );
}
