import { Song, Platform } from '../types/song';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import { PlatformBadge } from './PlatformBadge';
import { PlatformSelector } from './PlatformSelector';
import { Button } from './ui/button';
import { Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface SongRowProps {
  song: Song;
  onUpdate: (song: Song) => void;
  onDelete: () => void;
}

export const SongRow = ({ song, onUpdate, onDelete }: SongRowProps) => {
  const updateField = <K extends keyof Song>(field: K, value: Song[K]) => {
    onUpdate({ ...song, [field]: value });
  };

  const togglePlatform = (platform: Platform) => {
    const platforms = song.platforms.includes(platform)
      ? song.platforms.filter(p => p !== platform)
      : [...song.platforms, platform];
    updateField('platforms', platforms);
  };

  const getSearchUrl = (platform: 'spotify' | 'youtube') => {
    const query = encodeURIComponent(`${song.title} ${song.artist}`);
    return platform === 'spotify'
      ? `https://open.spotify.com/search/${query}`
      : `https://www.youtube.com/results?search_query=${query}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      className="rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Song</label>
          <Input
            value={song.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="Song title"
            className="font-medium"
          />
          <div className="flex gap-2">
            <a
              href={getSearchUrl('spotify')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-green-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Spotify
            </a>
            <a
              href={getSearchUrl('youtube')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              YouTube
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Artist</label>
          <Input
            value={song.artist}
            onChange={(e) => updateField('artist', e.target.value)}
            placeholder="Artist"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Featuring</label>
          <Input
            value={song.featuring}
            onChange={(e) => updateField('featuring', e.target.value)}
            placeholder="Features"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Album</label>
          <Input
            value={song.album}
            onChange={(e) => updateField('album', e.target.value)}
            placeholder="Album"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Year</label>
          <Input
            value={song.year}
            onChange={(e) => updateField('year', e.target.value)}
            placeholder="Year"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600">Producer</label>
          <Input
            value={song.producer}
            onChange={(e) => updateField('producer', e.target.value)}
            placeholder="Producer"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-medium text-gray-600">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {song.platforms.map(platform => (
              <PlatformBadge
                key={platform}
                platform={platform}
                onRemove={() => togglePlatform(platform)}
              />
            ))}
            <PlatformSelector
              selectedPlatforms={song.platforms}
              onToggle={togglePlatform}
            />
          </div>
        </div>

        <div className="space-y-3 md:col-span-2 lg:col-span-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={song.liked}
                onCheckedChange={(checked) => updateField('liked', checked as boolean)}
                className="bg-white border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Liked</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={(song as any).toAdd ?? false}
                onCheckedChange={(checked) => onUpdate({ ...song, toAdd: checked } as Song)}
                className="bg-white border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Add to Playlist</span>
            </label>

            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="ml-auto bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Comments</label>
            <Textarea
              value={song.comments}
              onChange={(e) => updateField('comments', e.target.value)}
              placeholder="Add your notes here..."
              className="mt-1"
              rows={2}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};