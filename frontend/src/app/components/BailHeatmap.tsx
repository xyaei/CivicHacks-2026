import { useState, useMemo, useEffect } from 'react';
import { Info, Map, Grid3x3 } from 'lucide-react';
import { BostonMapInteractive } from './BostonMapInteractive';
import { MassachusettsMapInteractive } from './MassachusettsMapInteractive';
import { fetchHeatmap } from '../api';

interface HeatmapProps {
  region: 'massachusetts' | 'boston';
  dateRange: string;
}

// Base MA counties (layout); medianBail overridden from API by date range
const massachusettsCountiesBase = [
  { name: 'Berkshire', medianBail: 0, cx: 140, cy: 280, r: 90 },
  { name: 'Franklin', medianBail: 0, cx: 320, cy: 160, r: 70 },
  { name: 'Hampshire', medianBail: 0, cx: 330, cy: 300, r: 65 },
  { name: 'Hampden', medianBail: 0, cx: 330, cy: 450, r: 70 },
  { name: 'Worcester', medianBail: 0, cx: 550, cy: 300, r: 120 },
  { name: 'Middlesex', medianBail: 0, cx: 800, cy: 180, r: 90 },
  { name: 'Essex', medianBail: 0, cx: 950, cy: 120, r: 70 },
  { name: 'Suffolk', medianBail: 0, cx: 920, cy: 280, r: 35 },
  { name: 'Norfolk', medianBail: 0, cx: 880, cy: 360, r: 60 },
  { name: 'Bristol', medianBail: 0, cx: 860, cy: 520, r: 80 },
  { name: 'Plymouth', medianBail: 0, cx: 1020, cy: 420, r: 85 },
  { name: 'Barnstable', medianBail: 0, cx: 1220, cy: 500, r: 70 },
  { name: 'Dukes', medianBail: 0, cx: 1120, cy: 650, r: 40 },
  { name: 'Nantucket', medianBail: 0, cx: 1280, cy: 650, r: 40 },
];

// Boston API name → map id (BostonMapInteractive)
const BOSTON_NAME_TO_ID: Record<string, string> = {
  'Allston-Brighton': 'allston_brighton',
  'Central': 'central',
  'Charlestown': 'charlestown',
  'East Boston': 'east_boston',
  'Roxbury': 'roxbury',
  'North Dorchester': 'north_dorchester',
  'South Boston': 'south_boston',
  'West Roxbury': 'west_roxbury',
};

// Boston neighborhoods (grid/layout); medianBail overridden from API when available
const bostonNeighborhoodsBase = [
  { 
    name: 'Charlestown', 
    medianBail: 11500,
    cx: 450,
    cy: 100,
    r: 40,
  },
  { 
    name: 'East Boston', 
    medianBail: 10200,
    cx: 600,
    cy: 120,
    r: 50,
  },
  { 
    name: 'Allston', 
    medianBail: 8800,
    cx: 150,
    cy: 200,
    r: 45,
  },
  { 
    name: 'Brighton', 
    medianBail: 9200,
    cx: 100,
    cy: 250,
    r: 45,
  },
  { 
    name: 'Back Bay', 
    medianBail: 14800,
    cx: 400,
    cy: 220,
    r: 35,
  },
  { 
    name: 'Beacon Hill', 
    medianBail: 16500,
    cx: 440,
    cy: 180,
    r: 25,
  },
  { 
    name: 'Downtown', 
    medianBail: 15200,
    cx: 480,
    cy: 200,
    r: 30,
  },
  { 
    name: 'North End', 
    medianBail: 13200,
    cx: 500,
    cy: 160,
    r: 25,
  },
  { 
    name: 'South End', 
    medianBail: 12800,
    cx: 420,
    cy: 260,
    r: 35,
  },
  { 
    name: 'Roxbury', 
    medianBail: 9800,
    cx: 380,
    cy: 320,
    r: 50,
  },
  { 
    name: 'Jamaica Plain', 
    medianBail: 10500,
    cx: 300,
    cy: 380,
    r: 50,
  },
  { 
    name: 'Dorchester', 
    medianBail: 8900,
    cx: 480,
    cy: 400,
    r: 60,
  },
  { 
    name: 'Mattapan', 
    medianBail: 7800,
    cx: 380,
    cy: 500,
    r: 45,
  },
  { 
    name: 'Hyde Park', 
    medianBail: 8200,
    cx: 350,
    cy: 560,
    r: 45,
  },
  { 
    name: 'West Roxbury', 
    medianBail: 9500,
    cx: 200,
    cy: 480,
    r: 55,
  },
];

// Charge types for grid heatmap
const chargeTypes = [
  'Assault',
  'Drug Possession',
  'Theft',
  'Burglary',
  'Robbery',
  'Weapon Violation',
  'DUI',
  'Fraud'
];

// Generate static grid data - using a seed-based approach for consistency
const generateStaticGridData = (locations: any[], chargeTypes: string[]) => {
  const data = [];
  for (let i = 0; i < locations.length; i++) {
    for (let j = 0; j < chargeTypes.length; j++) {
      // Use deterministic calculation based on location and charge type indices
      const baseMedian = locations[i].medianBail;
      // Create a pseudo-random but consistent value using indices
      const seed = (i * 7 + j * 13) % 100;
      const variance = ((seed / 100) - 0.5) * 4000;
      const median = Math.max(2000, Math.round(baseMedian + variance));
      
      data.push({
        location: locations[i].name,
        chargeType: chargeTypes[j],
        medianBail: median,
        row: i,
        col: j,
      });
    }
  }
  return data;
};

const getColorForBail = (bail: number) => {
  if (bail < 6000) return '#dbeafe';
  if (bail < 8000) return '#bfdbfe';
  if (bail < 10000) return '#93c5fd';
  if (bail < 12000) return '#60a5fa';
  if (bail < 14000) return '#3b82f6';
  return '#2563eb';
};

const getTextColorForBail = (bail: number) => {
  if (bail < 10000) return '#111827'; // gray-900 for lighter backgrounds
  return '#ffffff'; // white for darker backgrounds
};

const getBailLegendRanges = () => [
  { label: '$0 – $6K', color: '#dbeafe' },
  { label: '$6K – $8K', color: '#bfdbfe' },
  { label: '$8K – $10K', color: '#93c5fd' },
  { label: '$10K – $12K', color: '#60a5fa' },
  { label: '$12K – $14K', color: '#3b82f6' },
  { label: '$14K+', color: '#2563eb' },
];

function GeographicMapView({ 
  regions,
  isMassachusetts,
  countyData,
  neighborhoodData,
}: { 
  regions: any[];
  isMassachusetts: boolean;
  countyData?: Record<string, { displayName: string; medianBail: number }>;
  neighborhoodData?: Record<string, { displayName: string; medianBail: number }>;
}) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipData, setTooltipData] = useState<{ region: any; x: number; y: number } | null>(null);

  const handleMouseEnter = (region: any, event: React.MouseEvent) => {
    setHoveredRegion(region.name);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      region,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredRegion(null);
    setTooltipData(null);
  };

  const viewBox = isMassachusetts ? "0 0 1400 800" : "0 0 800 600";

  return (
    <>
      <div className="relative bg-white border border-gray-200 rounded-sm flex items-center justify-center overflow-hidden" style={{ height: '480px' }}>
        {isMassachusetts ? (
          <>
            {/* Massachusetts - Interactive SVG Map */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
              <MassachusettsMapInteractive 
                getColorForBail={getColorForBail}
                onHoverChange={(name, region, event) => {
                  if (name && region && event) {
                    handleMouseEnter(region, event);
                  } else {
                    handleMouseLeave();
                  }
                }}
                hoveredRegion={hoveredRegion}
                countyData={countyData}
              />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <BostonMapInteractive 
                getColorForBail={getColorForBail}
                onHoverChange={(name, region, event) => {
                  if (name && region && event) {
                    handleMouseEnter(region, event);
                  } else {
                    handleMouseLeave();
                  }
                }}
                hoveredRegion={hoveredRegion}
                neighborhoodData={neighborhoodData}
              />
            </div>
          </>
        )}

        {/* Tooltip */}
        {tooltipData && (
          <div
            className="fixed bg-gray-900 text-white border border-gray-700 rounded-sm shadow-xl p-3 pointer-events-none z-50 min-w-[160px]"
            style={{
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              {isMassachusetts ? 'County Data' : 'Neighborhood Data'}
            </p>
            <p className="text-base font-semibold text-white">{tooltipData.region.name}</p>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-gray-300">Median Bail</span>
                <span className="text-sm font-mono font-bold text-blue-300">
                  ${tooltipData.region.medianBail.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center">
          <div className="inline-flex flex-col gap-2">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide text-center mb-1">
              Median Bail Amount
            </div>
            <div className="flex items-center gap-2">
              {getBailLegendRanges().map((range, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div 
                    className="w-14 h-6 border border-gray-300 rounded-sm" 
                    style={{ backgroundColor: range.color }}
                  ></div>
                  <span className="text-xs text-gray-600 text-center whitespace-nowrap">
                    {range.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function GridHeatmapView({
  isMassachusetts,
  locations,
}: {
  isMassachusetts: boolean;
  locations: { name: string; medianBail: number; cx?: number; cy?: number; r?: number }[];
}) {
  
  const gridData = useMemo(() => generateStaticGridData(locations, chargeTypes), [locations]);
  
  const [hoveredCell, setHoveredCell] = useState<any | null>(null);
  const [tooltipData, setTooltipData] = useState<{ data: any; x: number; y: number } | null>(null);

  const cellWidth = 90;
  const cellHeight = 40;

  const handleMouseEnter = (data: any, event: React.MouseEvent) => {
    setHoveredCell(data);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipData({
      data,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setHoveredCell(null);
    setTooltipData(null);
  };

  return (
    <>
      <div className="relative bg-white border border-gray-200 rounded-sm overflow-auto" style={{ maxHeight: '480px' }}>
        <div className="inline-block min-w-full p-4">
          {/* Column headers (charge types) */}
          <div className="flex sticky top-0 bg-white z-10 pb-2" style={{ marginLeft: '140px' }}>
            {chargeTypes.map((chargeType, i) => (
              <div
                key={i}
                className="text-xs font-semibold text-gray-700 text-center px-1"
                style={{ width: `${cellWidth}px` }}
              >
                {chargeType}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {locations.map((location, rowIndex) => (
            <div key={rowIndex} className="flex items-center mb-1">
              {/* Row label */}
              <div className="text-xs font-semibold text-gray-700 text-right pr-3 sticky left-0 bg-white" style={{ width: '140px' }}>
                {location.name}
              </div>
              
              {/* Data cells */}
              {chargeTypes.map((chargeType, colIndex) => {
                const cellData = gridData.find(
                  d => d.row === rowIndex && d.col === colIndex
                );
                const isHovered = hoveredCell === cellData;
                
                return (
                  <div
                    key={colIndex}
                    className="border border-white cursor-pointer transition-all rounded-sm"
                    style={{
                      width: `${cellWidth}px`,
                      height: `${cellHeight}px`,
                      backgroundColor: cellData ? getColorForBail(cellData.medianBail) : '#f3f4f6',
                      transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                      zIndex: isHovered ? 10 : 1,
                      boxShadow: isHovered ? '0 4px 8px rgba(0,0,0,0.15)' : 'none',
                    }}
                    onMouseEnter={(e) => cellData && handleMouseEnter(cellData, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="flex items-center justify-center h-full">
                      <span className="text-xs font-semibold text-gray-900">
                        {cellData ? `$${(cellData.medianBail / 1000).toFixed(1)}K` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltipData && (
          <div
            className="fixed bg-gray-900 text-white border border-gray-700 rounded-sm shadow-xl p-3 pointer-events-none z-50 min-w-[160px]"
            style={{
              left: `${tooltipData.x}px`,
              top: `${tooltipData.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">{tooltipData.data.location}</p>
            <p className="text-base font-semibold text-white">{tooltipData.data.chargeType}</p>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <div className="flex justify-between items-center gap-4">
                <span className="text-xs text-gray-300">Median Bail</span>
                <span className="text-sm font-mono font-bold text-blue-300">
                  ${tooltipData.data.medianBail.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Color Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center">
          <div className="inline-flex flex-col gap-2">
            <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide text-center mb-1">
              Median Bail Amount by Charge Type
            </div>
            <div className="flex items-center gap-2">
              {getBailLegendRanges().map((range, index) => (
                <div key={index} className="flex flex-col items-center gap-1">
                  <div 
                    className="w-14 h-6 border border-gray-300 rounded-sm" 
                    style={{ backgroundColor: range.color }}
                  ></div>
                  <span className="text-xs text-gray-600 text-center whitespace-nowrap">
                    {range.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function BailHeatmap({ region, dateRange }: HeatmapProps) {
  const [displayMode, setDisplayMode] = useState<'geographic' | 'chart'>('geographic');
  const [heatmapData, setHeatmapData] = useState<{
    massachusetts: { name: string; medianBail: number }[];
    boston: { name: string; medianBail: number }[];
  } | null>(null);

  const isMassachusetts = region === 'massachusetts';

  useEffect(() => {
    fetchHeatmap(dateRange)
      .then(setHeatmapData)
      .catch(() => setHeatmapData(null));
  }, [dateRange]);

  const massachusettsCounties = useMemo(() => {
    const byName: Record<string, number> = {};
    (heatmapData?.massachusetts ?? []).forEach((c) => {
      byName[c.name] = c.medianBail;
    });
    return massachusettsCountiesBase.map((c) => ({
      ...c,
      medianBail: byName[c.name] ?? c.medianBail,
    }));
  }, [heatmapData]);

  const bostonNeighborhoods = useMemo(() => {
    const byName: Record<string, number> = {};
    (heatmapData?.boston ?? []).forEach((n) => {
      byName[n.name] = n.medianBail;
    });
    return bostonNeighborhoodsBase.map((n) => ({
      ...n,
      medianBail: byName[n.name] ?? n.medianBail,
    }));
  }, [heatmapData]);

  const countyDataForMap = useMemo(() => {
    const out: Record<string, { displayName: string; medianBail: number }> = {};
    massachusettsCounties.forEach((c) => {
      out[c.name.toLowerCase()] = { displayName: c.name, medianBail: c.medianBail };
    });
    return out;
  }, [massachusettsCounties]);

  const neighborhoodDataForMap = useMemo(() => {
    const out: Record<string, { displayName: string; medianBail: number }> = {};
    (heatmapData?.boston ?? []).forEach((n) => {
      const id = BOSTON_NAME_TO_ID[n.name];
      if (id) out[id] = { displayName: n.name, medianBail: n.medianBail };
    });
    return out;
  }, [heatmapData]);

  const mapRegions = isMassachusetts ? massachusettsCounties : bostonNeighborhoods;
  const gridLocations = isMassachusetts ? massachusettsCounties : bostonNeighborhoods;

  return (
    <div className="bg-white rounded-sm border border-gray-300 shadow-sm">
      <div className="border-b border-gray-300 px-6 py-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
              {isMassachusetts 
                ? 'Massachusetts Median Bail by County' 
                : 'Boston Median Bail by Neighborhood'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {displayMode === 'geographic'
                ? (isMassachusetts
                    ? 'Median bail amounts across Massachusetts counties'
                    : 'Median bail amounts across Boston neighborhoods')
                : (isMassachusetts
                    ? 'Median bail by county and charge type'
                    : 'Median bail by neighborhood and charge type')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0 border border-gray-300 rounded-sm overflow-hidden">
              <button
                onClick={() => setDisplayMode('geographic')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 border-r border-gray-300 ${
                  displayMode === 'geographic'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Map className="size-3.5" />
                Map View
              </button>
              <button
                onClick={() => setDisplayMode('chart')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  displayMode === 'chart'
                    ? 'bg-gray-900 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Grid3x3 className="size-3.5" />
                Grid View
              </button>
            </div>

            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors">
              <Info className="size-3.5" />
              Methodology
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {displayMode === 'geographic' ? (
          <GeographicMapView
            regions={mapRegions}
            isMassachusetts={isMassachusetts}
            countyData={isMassachusetts ? countyDataForMap : undefined}
            neighborhoodData={!isMassachusetts ? neighborhoodDataForMap : undefined}
          />
        ) : (
          <GridHeatmapView isMassachusetts={isMassachusetts} locations={gridLocations} />
        )}
      </div>
    </div>
  );
}