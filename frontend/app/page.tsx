import Link from "next/link";

export default function Home() {
  const games = [
    { name: "Snake & Ladder", href: "/snake-ladder", emoji: "🐍" },
    { name: "Traffic Simulation", href: "/traffic-simulation", emoji: "🚗" },
    { name: "Travelling Salesman", href: "/travelling-salesman", emoji: "🧭" },
    { name: "Tower of Hanoi", href: "/tower-hanoi", emoji: "🗼" },
    { name: "Eight Queens", href: "/eight-queens", emoji: "♕" },
  ];

  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/bg.jpg')",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>

      <div className="relative z-10 bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-10 max-w-md w-[90%] border border-white/20 text-center">
        <h1 className="text-5xl font-extrabold mb-10 tracking-wide text-white drop-shadow-lg">
          PENTAPLAY
        </h1>

        <div className="flex flex-col items-center gap-4">
          {games.map((game) => (
            <Link
              key={game.name}
              href={game.href}
              className="group relative flex items-center justify-start gap-4 w-72 h-16 rounded-xl overflow-hidden bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-black transition-all duration-300 shadow-lg hover:shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

              <div className="relative flex items-center justify-center w-full h-full px-6">
                <div className="flex items-center justify-center w-10 text-2xl">
                  {game.emoji}
                </div>
                <div className="flex-1 text-left text-lg font-semibold tracking-wide">
                  {game.name}
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </main>
  );
}
