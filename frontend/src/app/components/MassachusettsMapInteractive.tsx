import { useState } from 'react';
import svgPaths from '../../imports/svg-2cn7c66h8p';

interface MassachusettsMapInteractiveProps {
  getColorForBail: (bail: number) => string;
  onHoverChange: (county: string | null, region: any, event?: React.MouseEvent) => void;
  hoveredRegion: string | null;
  /** Override medianBail per county (key = lowercase name). Used for date-range heatmap. */
  countyData?: Record<string, { displayName: string; medianBail: number }>;
}

// Median bail by county from backend/query_result_cleaned.csv (court_division → county)
const massachusettsCountiesData: Record<string, { displayName: string; medianBail: number }> = {
  'berkshire': { displayName: 'Berkshire', medianBail: 75 },
  'franklin': { displayName: 'Franklin', medianBail: 0 },
  'hampshire': { displayName: 'Hampshire', medianBail: 5000 },
  'hampden': { displayName: 'Hampden', medianBail: 1000 },
  'worcester': { displayName: 'Worcester', medianBail: 5000 },
  'middlesex': { displayName: 'Middlesex', medianBail: 10000 },
  'essex': { displayName: 'Essex', medianBail: 0 },
  'suffolk': { displayName: 'Suffolk', medianBail: 0 },
  'norfolk': { displayName: 'Norfolk', medianBail: 0 },
  'bristol': { displayName: 'Bristol', medianBail: 5000 },
  'plymouth': { displayName: 'Plymouth', medianBail: 10000 },
  'barnstable': { displayName: 'Barnstable', medianBail: 7500 },
  'dukes': { displayName: 'Dukes', medianBail: 2500 },
  'nantucket': { displayName: 'Nantucket', medianBail: 10000 },
};

export function MassachusettsMapInteractive({
  getColorForBail,
  onHoverChange,
  hoveredRegion,
  countyData,
}: MassachusettsMapInteractiveProps) {
  const dataByCounty = countyData
    ? { ...massachusettsCountiesData, ...countyData }
    : massachusettsCountiesData;

  const handleMouseEnter = (countyId: string, event: React.MouseEvent) => {
    const data = dataByCounty[countyId];
    if (data) {
      onHoverChange(data.displayName, {
        name: data.displayName,
        medianBail: data.medianBail
      }, event);
    }
  };

  const handleMouseLeave = () => {
    onHoverChange(null, null);
  };

  const renderCounty = (countyId: string) => {
    const data = dataByCounty[countyId];
    if (!data) return null;

    const isHovered = hoveredRegion === data.displayName;
    const fillColor = getColorForBail(data.medianBail);

    // Handle counties with multiple paths (groups)
    if (countyId === 'norfolk') {
      return (
        <g
          key={countyId}
          id={countyId}
          onMouseEnter={(e) => handleMouseEnter(countyId, e)}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer transition-all duration-200"
          style={{
            filter: isHovered 
              ? 'brightness(0.9) saturate(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' 
              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
          }}
        >
          <path d={svgPaths.p2be30b00} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.p23341b00} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.p1ed6fa00} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.p2669fe00} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
        </g>
      );
    }

    if (countyId === 'barnstable') {
      return (
        <g
          key={countyId}
          id={countyId}
          onMouseEnter={(e) => handleMouseEnter(countyId, e)}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer transition-all duration-200"
          style={{
            filter: isHovered 
              ? 'brightness(0.9) saturate(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' 
              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
          }}
        >
          <path d={svgPaths.p1ce3cc00} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.p3e960200} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
        </g>
      );
    }

    if (countyId === 'dukes') {
      return (
        <g
          key={countyId}
          id={countyId}
          onMouseEnter={(e) => handleMouseEnter(countyId, e)}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer transition-all duration-200"
          style={{
            filter: isHovered 
              ? 'brightness(0.9) saturate(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' 
              : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
          }}
        >
          <path d={svgPaths.p35c33880} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.p1167fb80} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.p1ae3a00} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.p16df5400} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
          <path d={svgPaths.pd231900} fill={fillColor} stroke="#ffffff" strokeWidth="2" />
        </g>
      );
    }

    // Single path counties
    const pathMap: Record<string, string> = {
      'berkshire': svgPaths.p902bc00,
      'franklin': svgPaths.p36a44800,
      'worcester': svgPaths.p18e72400,
      'hampshire': svgPaths.p37a7c300,
      'hampden': svgPaths.p2e625400,
      'middlesex': svgPaths.p25a8a300,
      'essex': svgPaths.p3b03ad00,
      'suffolk': svgPaths.p3b859b00,
      'plymouth': svgPaths.p2fa62640,
      'bristol': svgPaths.p38248480,
      'nantucket': svgPaths.p221f0080,
    };

    const pathData = pathMap[countyId];
    if (!pathData) return null;

    return (
      <path
        key={countyId}
        id={countyId}
        d={pathData}
        fill={fillColor}
        stroke="#ffffff"
        strokeWidth="2"
        className="cursor-pointer transition-all duration-200"
        style={{
          filter: isHovered 
            ? 'brightness(0.9) saturate(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' 
            : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
        }}
        onMouseEnter={(e) => handleMouseEnter(countyId, e)}
        onMouseLeave={handleMouseLeave}
      />
    );
  };

  return (
    <svg
      className="w-full h-full"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 1149.64 712.767"
    >
      <g id="Frame 1">
        {Object.keys(dataByCounty).map(countyId => renderCounty(countyId))}
      </g>
    </svg>
  );
}
