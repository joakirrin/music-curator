// src/components/FilterBar.tsx
import type { FilterType } from "../types/song";

type Props = {
  value: FilterType;
  onChange: (next: FilterType) => void;
  search: string;
  onSearch: (q: string) => void;
};

export default function FilterBar({ value, onChange, search, onSearch }: Props) {
  return (
    <div className="container mx-auto px-4 py-3 flex items-center gap-3 bg-white">
      <div className="flex items-center gap-2">
        {(["all", "liked", "toAdd", "pending"] as FilterType[]).map((k) => (
          <button
            key={k}
            onClick={() => onChange(k)}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              value === k ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"
            }`}
          >
            {k === "toAdd" ? "To Add" : k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search title / artist / album / producer / comments / featuring"
        className="ml-auto w-full max-w-md px-3 py-2 rounded-xl border text-sm"
      />
    </div>
  );
}
