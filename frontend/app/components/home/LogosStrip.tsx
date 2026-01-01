export default function LogosStrip() {
  const logos = ['TechCrunch', 'Forbes', 'WSJ', 'The Verge']

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wide">
          Trusted by leading publications
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-2xl font-bold text-gray-400"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

