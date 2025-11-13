// src/components/FilterBar.tsx
import { useMemo } from "react";
import type { FilterType, VerificationFilterType, Song } from "../types/song";

type Props = {
  value: FilterType;
  onChange: (next: FilterType) => void;
  verificationFilter: VerificationFilterType;
  onVerificationFilterChange: (next: VerificationFilterType) => void;
  search: string;
  onSearch: (q: string) => void;
  songs: Song[];
  selectedRound: number | "all";
  onRoundChange: (round: number | "all") => void;
};

export default function FilterBar({
  value,
  onChange,
  verificationFilter,
  onVerificationFilterChange,
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

  // Progress statistics (per round)
  const progressStats = useMemo(() => {
    let songsToCount = songs;
    if (selectedRound !== "all") {
      songsToCount = songs.filter((s) => s.round === selectedRound);
    }

    const total = songsToCount.length;
    const kept = songsToCount.filter((s) => s.feedback === "keep").length;
    const skipped = songsToCount.filter((s) => s.feedback === "skip").length;
    const reviewed = kept + skipped;
    const pending = total - reviewed;
    const percentage = total > 0 ? Math.round((reviewed / total) * 100) : 0;

    return { total, kept, skipped, reviewed, pending, percentage };
  }, [songs, selectedRound]);

  // Verification statistics (per round)
  const verificationStats = useMemo(() => {
    let songsToCount = songs;
    if (selectedRound !== "all") {
      songsToCount = songs.filter((s) => s.round === selectedRound);
    }

    const total = songsToCount.length;
    const verified = songsToCount.filter(
      (s) => s.verificationStatus === "verified",
    ).length;
    const failed = songsToCount.filter(
      (s) => s.verificationStatus === "failed",
    ).length;
    const unverified = songsToCount.filter(
      (s) => s.verificationStatus === "unverified" || !s.verificationStatus,
    ).length;

    return { total, verified, failed, unverified };
  }, [songs, selectedRound]);

  return (
    <div className="container mx-auto px-4 py-3 bg-gray-900 border-b border-gray-700">
      {/* Main Filter Row */}
      <div className="flex items-center gap-3">
        {/* Status Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 mr-1">Status:</span>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value as FilterType)}
            className="px-3 py-1.5 rounded-full text-sm border border-gray-600 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All</option>
            <option value="keep">✓ Keep</option>
            <option value="skip">✗ Skip</option>
            <option value="pending">⏸ Pending</option>
          </select>
        </div>

        {/* Search Input (se mantiene en el mismo lugar) */}
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search title / artist / album / producer / comments / featuring"
          className="ml-auto w-full max-w-md px-3 py-2 rounded-xl border border-gray-500 bg-gray-600 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {/* Progress Counter – % reviewed por encima de la lista, alineado a la derecha */}
        {progressStats.total > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-600">
            <span className="text-xs font-medium text-gray-300">
              📊 {progressStats.reviewed}/{progressStats.total} reviewed
            </span>
            {progressStats.percentage > 0 && (
              <span className="text-xs font-bold text-emerald-400">
                ({progressStats.percentage}%)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Verification Status Filter Row */}
      {verificationStats.total > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
          <span className="text-xs font-medium text-gray-400 mr-1">
            Verification:
          </span>

          {/* All */}
          <button
            onClick={() => onVerificationFilterChange("all")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              verificationFilter === "all"
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
            }`}
          >
            All{" "}
            {verificationStats.total > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({verificationStats.total})
              </span>
            )}
          </button>

          {/* Verified */}
          <button
            onClick={() => onVerificationFilterChange("verified")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              verificationFilter === "verified"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
            }`}
          >
            ✓ Verified{" "}
            {verificationStats.verified > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({verificationStats.verified})
              </span>
            )}
          </button>

          {/* Failed (muy importante mantenerlo) */}
          <button
            onClick={() => onVerificationFilterChange("failed")}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              verificationFilter === "failed"
                ? "bg-red-600 text-white border-red-600"
                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750"
            }`}
          >
            ✗ Failed{" "}
            {verificationStats.failed > 0 && (
              <span className="ml-1 text-xs opacity-75">
                ({verificationStats.failed})
              </span>
            )}
          </button>
        </div>
      )}

      {/* Round Filter Row (se mantiene donde ya estaba) */}
      {availableRounds.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700">
          <span className="text-xs font-medium text-gray-400 mr-1">
            Rounds:
          </span>

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
            {availableRounds.length} round
            {availableRounds.length !== 1 ? "s" : ""} available
          </span>
        </div>
      )}
    </div>
  );
}
