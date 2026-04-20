import KPIPanel from './KPIPanel';
import FairwayDiagram from './FairwayDiagram';
import GreenDiagram from './GreenDiagram';

export default function HoleView({ hole, onUpdate, onPrev, onNext, hasPrev, hasNext }) {
  const updateFairwayShots = (shots) => onUpdate((h) => ({ ...h, fairwayShots: shots }));
  const updateGreenShots = (shots) => onUpdate((h) => ({ ...h, greenShots: shots }));

  return (
    <div className="flex-1 overflow-y-auto">
      {/* KPI Panel */}
      <KPIPanel
        hole={hole}
        onUpdate={onUpdate}
        onPrev={onPrev}
        onNext={onNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      {/* Diagrams */}
      <div className="px-3 pb-4 space-y-4 mt-3">
        {/* Fairway */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Fairway</h3>
            <span className="text-xs text-gray-400">Tap to place shot</span>
          </div>
          <FairwayDiagram
            shots={hole.fairwayShots || []}
            onShotsChange={updateFairwayShots}
          />
        </div>

        {/* Green */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Green</h3>
            <span className="text-xs text-gray-400">Tap to place shot</span>
          </div>
          <GreenDiagram
            shots={hole.greenShots || []}
            onShotsChange={updateGreenShots}
          />
        </div>
      </div>
    </div>
  );
}
