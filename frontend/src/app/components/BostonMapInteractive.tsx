import { useState } from 'react';
import svgPaths from '../../imports/svg-34a8h8vc18';

interface BostonMapInteractiveProps {
  getColorForBail: (bail: number) => string;
  onHoverChange: (neighborhood: string | null, region: any, event?: React.MouseEvent) => void;
  hoveredRegion: string | null;
}

// Boston neighborhoods data matching SVG IDs
const bostonNeighborhoodsData: Record<string, { displayName: string; medianBail: number }> = {
  'allston_brighton': { displayName: 'Allston-Brighton', medianBail: 9000 },
  'west_roxbury': { displayName: 'West Roxbury', medianBail: 9500 },
  'hyde_park': { displayName: 'Hyde Park', medianBail: 8200 },
  'mattapan': { displayName: 'Mattapan', medianBail: 7800 },
  'roslindale': { displayName: 'Roslindale', medianBail: 8600 },
  'jamaica_plain': { displayName: 'Jamaica Plain', medianBail: 10500 },
  'roxbury': { displayName: 'Roxbury', medianBail: 9800 },
  'south_dorchester': { displayName: 'South Dorchester', medianBail: 8500 },
  'north_dorchester': { displayName: 'North Dorchester', medianBail: 9300 },
  'south_boston': { displayName: 'South Boston', medianBail: 13500 },
  'fenway_kenmore': { displayName: 'Fenway-Kenmore', medianBail: 12200 },
  'backbay_beaconhill': { displayName: 'Back Bay / Beacon Hill', medianBail: 15600 },
  'southend': { displayName: 'South End', medianBail: 12800 },
  'central': { displayName: 'Central', medianBail: 15200 },
  'charlestown': { displayName: 'Charlestown', medianBail: 11500 },
  'east_boston': { displayName: 'East Boston', medianBail: 10200 },
};

// Neighborhood configurations with positioning and viewBox
const neighborhoodConfigs = [
  {
    id: 'allston_brighton',
    inset: '19.43% 54.93% 58.44% 31.68%',
    viewBox: '0 0 214.245 199.138',
    path: svgPaths.p159651b0,
  },
  {
    id: 'west_roxbury',
    inset: '55.06% 58.48% 19.27% 28.22%',
    viewBox: '0 0 212.759 231.09',
    path: svgPaths.p24d01200,
  },
  {
    id: 'hyde_park',
    inset: '67.88% 51.87% 6.26% 37.78%',
    viewBox: '0 0 165.47 232.66',
    path: svgPaths.p2db30f80,
  },
  {
    id: 'mattapan',
    inset: '58.06% 45.71% 24.54% 45.71%',
    viewBox: '0 0 137.177 156.587',
    path: svgPaths.pbbcb200,
  },
  {
    id: 'roslindale',
    inset: '56.14% 51.62% 21.84% 37.6%',
    viewBox: '0 0 172.529 198.16',
    path: svgPaths.p2f0d0780,
  },
  {
    id: 'jamaica_plain',
    inset: '38% 50.3% 41.06% 39.07%',
    viewBox: '0 0 170.074 188.415',
    path: svgPaths.p9ed9d00,
  },
  {
    id: 'roxbury',
    inset: '39.4% 45.49% 39.24% 45.78%',
    viewBox: '0 0 139.619 192.269',
    path: svgPaths.p2a237d00,
  },
  {
    id: 'south_dorchester',
    inset: '51.08% 39.03% 26.44% 51.93%',
    viewBox: '0 0 144.679 202.285',
    path: svgPaths.p134f6eb0,
  },
  {
    id: 'north_dorchester',
    inset: '39% 38.11% 43.88% 53.68%',
    viewBox: '0 0 131.263 154.132',
    path: svgPaths.pe1fabc0,
  },
  {
    id: 'south_boston',
    inset: '28.83% 33.04% 54.03% 55.1%',
    viewBox: '0 0 189.708 154.19',
    path: svgPaths.p29e90d00,
  },
  {
    id: 'fenway_kenmore',
    inset: '30.27% 48.69% 60.6% 45.28%',
    viewBox: '0 0 96.5556 82.19',
    path: svgPaths.p162b2b80,
  },
  {
    id: 'backbay_beaconhill',
    inset: '25.8% 44.55% 64.63% 49.13%',
    viewBox: '0 0 101.127 86.0941',
    path: svgPaths.p1413d100,
  },
  {
    id: 'southend',
    inset: '32.84% 43.92% 59.29% 50.11%',
    viewBox: '0 0 95.3865 70.8747',
    path: svgPaths.p11273100,
  },
  {
    id: 'central',
    inset: '21.4% 41.31% 66.2% 53.07%',
    viewBox: '0 0 89.7926 111.595',
    path: svgPaths.p3bd98400,
  },
  {
    id: 'charlestown',
    inset: '8.48% 41.22% 78.32% 51.57%',
    viewBox: '0 0 115.35 118.766',
    path: svgPaths.p3a16ba00,
  },
  {
    id: 'east_boston',
    inset: '5.3% 28.24% 67.36% 59.08%',
    viewBox: '0 0 202.785 246.066',
    path: svgPaths.p5d16c00,
  },
];

export function BostonMapInteractive({
  getColorForBail,
  onHoverChange,
  hoveredRegion
}: BostonMapInteractiveProps) {
  const handleMouseEnter = (neighborhoodId: string, event: React.MouseEvent) => {
    const data = bostonNeighborhoodsData[neighborhoodId];
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

  return (
    <div className="relative size-full">
      {neighborhoodConfigs.map((config) => {
        const data = bostonNeighborhoodsData[config.id];
        if (!data) return null;

        const isHovered = hoveredRegion === data.displayName;
        const fillColor = getColorForBail(data.medianBail);

        return (
          <div
            key={config.id}
            className="absolute"
            style={{ inset: config.inset }}
            data-name={config.id}
          >
            <svg
              className="absolute block size-full cursor-pointer transition-all duration-200"
              fill="none"
              preserveAspectRatio="none"
              viewBox={config.viewBox}
              onMouseEnter={(e) => handleMouseEnter(config.id, e)}
              onMouseLeave={handleMouseLeave}
              style={{
                filter: isHovered 
                  ? 'brightness(0.9) saturate(1.2) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' 
                  : 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
              }}
            >
              <path
                d={config.path}
                fill={fillColor}
                stroke="#ffffff"
                strokeWidth="2"
                id={config.id}
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}