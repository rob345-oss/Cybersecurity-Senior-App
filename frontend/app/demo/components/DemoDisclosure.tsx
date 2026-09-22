'use client'

interface DemoDisclosureProps {
  items: readonly string[]
}

export default function DemoDisclosure({ items }: DemoDisclosureProps) {
  return (
    <ul className="flex flex-wrap gap-2 justify-center" aria-label="Demo disclosures">
      {items.map((item) => (
        <li
          key={item}
          className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium border border-gray-200"
        >
          {item}
        </li>
      ))}
    </ul>
  )
}
