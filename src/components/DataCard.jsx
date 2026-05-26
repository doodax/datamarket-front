import { Check } from 'lucide-react';

// Carte d'une catégorie de données dans le catalogue.
// Props :
// - category : objet catégorie (id, name, price, tag, description_neutral, section)
// - selected : booléen
// - disabled : booléen (verrouillé ou budget insuffisant)
// - relevance : 0-3 (mode "sector_hints") ou null
// - showDescription : afficher la description neutre (mode "descriptions")
// - onClick : handler clic

export default function DataCard({ category, selected, disabled, relevance, showDescription, onClick }) {
  const tagColors = {
    BESTSELLER: 'bg-terminal-amber text-ink-900',
    HOT: 'bg-terminal-red text-white',
    PREMIUM: 'bg-terminal-purple text-white'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative text-left p-3 transition-all duration-150 border w-full group
        ${selected
          ? 'bg-terminal-cyan/10 border-terminal-cyan'
          : 'bg-ink-800/50 border-ink-600 hover:border-ink-400'
        }
        ${disabled && !selected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Tag commercial */}
      {category.tag && (
        <span className={`tag-product ${tagColors[category.tag] || 'bg-ink-500 text-white'}`}>
          {category.tag}
        </span>
      )}

      {/* Checkmark si sélectionné */}
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-terminal-cyan flex items-center justify-center">
          <Check size={14} className="text-ink-900" strokeWidth={3} />
        </div>
      )}

      <div className="flex flex-col gap-2 min-h-[80px]">
        <div className="text-[13px] leading-tight pr-6 text-ink-100">
          {category.name}
        </div>

        {showDescription && category.description_neutral && (
          <div className="text-[11px] text-ink-300 italic">
            {category.description_neutral}
          </div>
        )}

        <div className="flex items-end justify-between mt-auto pt-1">
          <div className="font-mono text-terminal-cyan font-bold text-lg leading-none">
            {category.price}
            <span className="text-ink-200 text-[11px] ml-1">CHF</span>
          </div>

          {/* Indicateur de pertinence si activé */}
          {relevance !== null && relevance !== undefined && (
            <div className="flex gap-0.5" title={`Pertinence : ${relevance}/3`}>
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 ${i <= relevance ? 'bg-terminal-green' : 'bg-ink-600'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-[11px] font-mono text-ink-200 uppercase tracking-wider">
          / 100 profils
        </div>
      </div>
    </button>
  );
}
