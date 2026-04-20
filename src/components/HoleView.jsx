import KPIPanel from './KPIPanel';
import FairwayDiagram from './FairwayDiagram';
import GreenDiagram from './GreenDiagram';

export default function HoleView({ hole, onUpdate, onPrev, onNext, hasPrev, hasNext }) {
  const updateFairwayShots = (shots) => onUpdate((h) => ({ ...h, fairwayShots: shots }));
  const updateGreenShots = (shots) => onUpdate((h) => ({ ...h, greenShots: shots }));

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fb]">
      {/* KPI Panel */}
      <KPIPanel
        hole={hole}
        onUpdate={onUpdate}
        onPrev={onPrev}
        onNext={onNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      {/* Diagrams — flush, no card wrapper */}
      <div className="pb-4 mt-3 space-y-4">
        <FairwayDiagram
          shots={hole.fairwayShots || []}
          onShotsChange={updateFairwayShots}
        />
        <GreenDiagram
          shots={hole.greenShots || []}
          onShotsChange={updateGreenShots}
        />
      </div>
    </div>
  );
}
