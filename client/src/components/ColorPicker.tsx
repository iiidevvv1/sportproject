import { ArrowRight } from 'lucide-react';
import { STONE_COLORS, type StoneColor } from '../types';

interface ColorPickerProps {
  value: StoneColor;
  onChange: (color: StoneColor) => void;
  disabledColor?: StoneColor;
}

const AVAILABLE_COLORS: StoneColor[] = ['red', 'yellow', 'blue', 'green'];

export default function ColorPicker({ value, onChange, disabledColor }: ColorPickerProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {AVAILABLE_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          disabled={color === disabledColor}
          className={`w-10 h-10 rounded-full transition-all shadow-sm flex items-center justify-center
            ${value === color ? 'scale-110' : 'hover:scale-105'}
            ${color === disabledColor ? 'opacity-30 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: STONE_COLORS[color],
            boxShadow: value === color ? `0 0 0 4px ${STONE_COLORS[color]}66` : 'none',
          }}
        >
          {value === color && <ArrowRight size={14} className="text-white rotate-90" />}
        </button>
      ))}
    </div>
  );
}
