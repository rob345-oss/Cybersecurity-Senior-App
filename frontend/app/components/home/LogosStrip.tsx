export default function LogosStrip() {
  const logos = ['TechCrunch', 'Forbes', 'WSJ', 'The Verge']

  return (
    <section className="border-y border-slate-100 bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="mb-8 text-center text-xs font-medium uppercase tracking-widest text-slate-400">
          As featured in
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {logos.map((logo) => (
            <span key={logo} className="text-lg font-semibold text-slate-300 transition-colors hover:text-slate-400">
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
