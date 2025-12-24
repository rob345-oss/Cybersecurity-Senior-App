interface ChipGridProps {
  items: string[];
  selected: Set<string>;
  onToggle: (item: string) => void;
}

export default function ChipGrid({ items, selected, onToggle }: ChipGridProps) {
  return (
    <div className="chip-grid">
      {items.map((item) => (
        <button
          type="button"
          key={item}
          className={`chip ${selected.has(item) ? "selected" : ""}`}
          onClick={() => onToggle(item)}
        >
          {item.replaceAll("_", " ")}
        </button>
      ))}
    </div>
  );
}
