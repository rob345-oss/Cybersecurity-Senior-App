interface ChipGridProps {
  items: string[]
  selected: Set<string>
  onToggle: (item: string) => void
}

export default function ChipGrid({ items, selected, onToggle }: ChipGridProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selected.has(item)
              ? 'bg-blue-600 text-white border border-blue-600'
              : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => onToggle(item)}
        >
          {item.replaceAll('_', ' ')}
        </button>
      ))}
    </div>
  )
}

