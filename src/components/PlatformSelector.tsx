import { Platform } from '../types/song';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus } from 'lucide-react';

const allPlatforms: Platform[] = ['Spotify', 'YouTube', 'Bandcamp', 'SoundCloud'];

interface PlatformSelectorProps {
  selectedPlatforms: Platform[];
  onToggle: (platform: Platform) => void;
}

export const PlatformSelector = ({ selectedPlatforms, onToggle }: PlatformSelectorProps) => {
  const availablePlatforms = allPlatforms.filter(p => !selectedPlatforms.includes(p));

  if (availablePlatforms.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-6 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 bg-white border border-gray-200 shadow-lg">
        <div className="space-y-1 p-1">
          {availablePlatforms.map(platform => (
            <Button
              key={platform}
              variant="ghost"
              className="w-full justify-start text-gray-900 bg-white hover:bg-emerald-600 hover:text-white transition-colors"
              onClick={() => onToggle(platform)}
            >
              {platform}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};