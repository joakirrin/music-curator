// src/components/FilterBar.tsx
import { useMemo } from "react";
import type { FilterType, Song } from "../types/song";

type Props = {
  value: FilterType;
  onChange: (next: FilterType) => void;
  search: string;
  onSearch: (q: string) => void;
  songs: Song[];
  selectedRound: number | "all";
  onRoundChange: (round: number | "all") => void;
};

export default function FilterBar({
  value,
  onChange,
  search,
  onSearch,
  songs,
  selectedRound,
  onRoundChange,
}: Props) {
  const availableRounds = useMemo(() => {
    const rounds = songs
      .map((s) => s.round)
      .filter((r): r is number => typeof r === "number");
    
    if (rounds.length === 0) return [];
    
    const unique = Array.from(new Set(rounds)).sort((a, b) => b - a);
    return unique;
  }, [songs]);

  const latestRound = availableRounds.length > 0 ? availableRounds[0] : null;

  const chatgptCount = useMemo(() => {
    return songs.filter(s => s.source === "chatgpt").length;
  }, [songs]);

  return (
    <div className="container mx-auto px-4 py-3 bg-gray-900 border-b border-gray-700">
      {/* ✅ Dark mode: gray-900 background */}
      
      {/* Main Filter Row */}
      <div className="flex items-center gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {(["all", "liked", "toAdd", "pending", "chatgpt"] as FilterType[]).map((k) => {
            const isChatGPT = k === "chatgpt";
            const isActive = value === k;
            
            return (
              <button
                key={k}
                onClick={() => onChange(k)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  isActive
                    ? isChatGPT
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-700 text-white border-gray-700"
                    : isChatGPT
                    ? "bg-emerald-900/30 text-emerald-300 border-emerald-700 hover:bg-emerald-900/50"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
                }`}
              >
                {k === "toAdd" 
                  ? "To Add" 
                  : k === "chatgpt" 
                  ? `🤖 ChatGPT ${chatgptCount > 0 ? `(${chatgptCount})` : ''}`
                  : k[0].toUpperCase() + k.slice(1)
                }
              </button>
            );
          })}
        </div>

        {/* Search Input - ✅ WHITE background */}
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search title / artist / album / producer / comments / featuring"
          className="ml-auto w-full max-w-md px-3 py-2 rounded-xl border border-gray-600 bg-white text-gray-900 placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Round Filter Row */}
      {availableRounds.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
          <span className="text-sm font-medium text-gray-400">Rounds:</span>
          
          <button
            onClick={() => onRoundChange("all")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selectedRound === "all"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
            }`}
          >
            All
          </button>

          {latestRound !== null && (
            <button
              onClick={() => onRoundChange(latestRound)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedRound === latestRound
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-emerald-900/30 text-emerald-300 border-emerald-700 hover:bg-emerald-900/50"
              }`}
            >
              ⭐ Latest (Round {latestRound})
            </button>
          )}

          <div className="flex items-center gap-2 ml-2">
            {availableRounds.map((round) => (
              <button
                key={round}
                onClick={() => onRoundChange(round)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selectedRound === round
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
                }`}
              >
                Round {round}
              </button>
            ))}
          </div>

          <span className="ml-auto text-xs text-gray-500">
            {availableRounds.length} round{availableRounds.length !== 1 ? "s" : ""}{" "}
            available
          </span>
        </div>
      )}
    </div>
  );
}
