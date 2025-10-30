import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FilterType } from '../types/song';

interface FilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterType: FilterType;
  onFilterChange: (value: FilterType) => void;
}

export const FilterBar = ({ searchTerm, onSearchChange, filterType, onFilterChange }: FilterBarProps) => {
  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="container mx-auto flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search songs, artists, albums..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterType} onValueChange={(value) => onFilterChange(value as FilterType)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Songs</SelectItem>
            <SelectItem value="liked">Liked</SelectItem>
            <SelectItem value="toAdd">To Add</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
