import { useState } from 'react';
import { generateId } from '../utils/uuid';
import { createEmptyHoles } from '../utils/storage';

const TEES = ['gold', 'blue', 'grey', 'white'];

const TEE_STYLES = {
  gold: 'bg-yellow-400 text-yellow-900 border-yellow-400',
  blue: 'bg-blue-500 text-white border-blue-500',
  grey: 'bg-gray-400 text-white border-gray-400',
  white: 'bg-white text-gray-700 border-gray-400',
};

export default function NewRound({ onSave, onCancel }) {
  const [course, setCourse] = useState('');
  const [date, setDate] = useState(todayISO());
  const [tees, setTees] = useState('blue');
  const [conditions, setConditions] = useState('');

  const handleSave = () => {
    const round = {
      id: generateId(),
      course: course.trim() || 'Unnamed Course',
      date,
      tees,
      conditions: conditions.trim(),
      holes: createEmptyHoles(),
    };
    onSave(round);
  };

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={onCancel}
          className="p-2 -ml-2 rounded-full active:bg-gray-100 transition-colors text-[#111827]"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-[#111827]">New Round</h1>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Course Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Course Name</label>
          <input
            type="text"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            placeholder="e.g. Shawnee Golf Course"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Tees */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Tees</label>
          <div className="flex gap-3">
            {TEES.map((t) => (
              <button
                key={t}
                onClick={() => setTees(t)}
                className={[
                  'flex-1 py-3 rounded-xl border-2 font-semibold capitalize text-sm transition-all',
                  tees === t
                    ? `${TEE_STYLES[t]} shadow-md scale-105`
                    : 'bg-white text-gray-400 border-gray-200',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Conditions */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Conditions <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={conditions}
            onChange={(e) => setConditions(e.target.value)}
            placeholder="e.g. Windy, Wet fairways..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Start Button */}
        <button
          onClick={handleSave}
          className="w-full bg-green-700 hover:bg-green-600 active:bg-green-800 text-white font-bold py-4 rounded-2xl shadow-md transition-colors text-lg mt-4"
        >
          Start Round
        </button>
      </div>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
