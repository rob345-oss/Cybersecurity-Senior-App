const steps = [
  {
    number: '1',
    title: 'Sign Up',
    description: 'Create your account and get early access to Titanium Guardian protection.',
  },
  {
    number: '2',
    title: 'Set Up',
    description: 'Install our app and configure your protection preferences in minutes.',
  },
  {
    number: '3',
    title: 'Stay Protected',
    description: 'Receive real-time alerts and coaching to stay safe from scams.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-slate-900">How It Works</h2>
          <p className="mx-auto max-w-2xl text-xl text-slate-600">Simple setup, powerful protection</p>
        </div>
        <div className="relative grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-8 hidden h-0.5 bg-teal-200 md:block md:mx-[16%]" aria-hidden />
          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent text-2xl font-bold text-white shadow-lg">
                {step.number}
              </div>
              <h3 className="mb-4 text-2xl font-semibold text-slate-900">{step.title}</h3>
              <p className="leading-relaxed text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
