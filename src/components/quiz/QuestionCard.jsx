import React from 'react';

/**
 * QuestionCard component displaying the question stem, MCQ choices,
 * and explanation alerts upon quiz submission.
 * 
 * @param {Object} props
 * @param {Object} props.question - The question details
 * @param {string} props.selectedOption - User's selected option letter ('A', 'B', etc.)
 * @param {Function} props.onSelectOption - Callback to save choice
 * @param {boolean} props.isSubmitted - True if answers are locked and scored
 */
export function QuestionCard({ question, selectedOption, onSelectOption, isSubmitted }) {
  if (!question) return null;

  const options = [
    { label: 'A', text: question.optionA },
    { label: 'B', text: question.optionB },
    { label: 'C', text: question.optionC },
    { label: 'D', text: question.optionD }
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Question Stem */}
      <h3 className="text-base md:text-lg font-bold text-white leading-relaxed">
        {question.stem}
      </h3>

      {/* Options List */}
      <div className="space-y-3">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.label;
          const isCorrect = question.correctOption === opt.label;
          const isWrong = isSelected && !isCorrect;

          let btnClass = 'border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700';
          let labelClass = 'bg-slate-900 border-slate-800 text-slate-400';

          if (isSubmitted) {
            if (isCorrect) {
              btnClass = 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
              labelClass = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
            } else if (isWrong) {
              btnClass = 'border-red-500/30 bg-red-500/10 text-red-300';
              labelClass = 'bg-red-500/20 border-red-500/40 text-red-400';
            } else {
              btnClass = 'border-slate-900 bg-slate-950/20 text-slate-500 opacity-60';
              labelClass = 'bg-slate-950 border-slate-900 text-slate-600';
            }
          } else if (isSelected) {
            btnClass = 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300';
            labelClass = 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400';
          }

          return (
            <button
              key={opt.label}
              disabled={isSubmitted}
              onClick={() => onSelectOption(question.id, opt.label)}
              className={`w-full flex items-center space-x-4 border rounded-xl p-4 transition-all duration-150 text-sm font-medium ${btnClass}`}
            >
              {/* Option label badge (A, B, C, D) */}
              <span className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs flex-shrink-0 ${labelClass}`}>
                {opt.label}
              </span>
              <span className="leading-tight text-left">{opt.text}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation Box */}
      {isSubmitted && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
          selectedOption === question.correctOption 
            ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400' 
            : 'bg-indigo-500/5 border-indigo-500/15 text-indigo-400'
        }`}>
          <div className="font-bold mb-1 uppercase tracking-wide text-[10px]">
            {selectedOption === question.correctOption ? 'Correct Answer' : 'Explanation'}
          </div>
          {question.explanation || 'No additional explanation available.'}
        </div>
      )}
    </div>
  );
}

export default QuestionCard;
