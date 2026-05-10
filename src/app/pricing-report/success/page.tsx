import Link from 'next/link'

export default function SuccessPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-charcoal text-white flex items-center justify-center text-3xl mb-8">
        ✓
      </div>
      <h1 className="text-3xl font-light text-charcoal mb-4">
        Subskrypcja aktywna
      </h1>
      <p className="text-charcoal/80 mb-10">
        Twój pierwszy raport jest gotowy. Sprawdź panel sprzedawcy, by zobaczyć tabelę cen, alerty i rekomendacje.
      </p>
      <Link
        href="/account/pricing-report"
        className="inline-flex items-center justify-center bg-charcoal text-white px-8 py-4 rounded-full text-sm tracking-wide hover:bg-charcoal/90 transition-colors"
      >
        Otwórz raport
      </Link>
      <p className="text-[11px] text-warm-gray mt-8">
        To jest demo — nie nastąpiła realna transakcja.
      </p>
    </div>
  )
}
