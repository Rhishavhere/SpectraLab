import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpectrumPlaceholder from "./SpectrumPlaceholder";
// Import the specific simulator function and the NMRPeak type
import { simulateNMRSpectrum } from "@/lib/spectrum-simulator";
import type { NMRPeak } from "@/lib/spectrum-simulator"; // Import type
import { cn } from "@/lib/utils"; // For conditional classes

interface NMRSpectrumProps {
  smiles: string;
  className?: string;
}

// Component using the updated simulator output
const NMRSpectrum = ({ smiles, className }: NMRSpectrumProps) => {
  const [loading, setLoading] = useState(false);
  // State holds the array of NMRPeak objects
  const [peakData, setPeakData] = useState<NMRPeak[]>([]);
  const [nmrType, setNmrType] = useState<"1H" | "13C">("1H");

  useEffect(() => {
    if (!smiles) {
      setPeakData([]);
      return;
    }

    setLoading(true);
    setPeakData([]); // Clear previous data

    const timer = setTimeout(() => {
      try {
        // Simulator directly returns the NMRPeak array
        const simulatedData = simulateNMRSpectrum(smiles, nmrType);
        setPeakData(simulatedData);
      } catch (error) {
        console.error(`Error simulating ${nmrType} NMR spectrum:`, error);
        setPeakData([]);
      } finally {
        setLoading(false);
      }
    }, 700); // Slightly faster timeout maybe

    return () => clearTimeout(timer);

  }, [smiles, nmrType]);

  // --- Render Logic ---

  if (!smiles) {
    return <SpectrumPlaceholder type="NMR" />;
  }

  // --- Chart Setup ---
  const width = 800;
  const height = 450; // Consistent height
  const padding = { top: 50, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X-axis: Chemical Shift (ppm), reversed scale
  const xMin = nmrType === "1H" ? -0.5 : -10; // Extend range slightly
  const xMax = nmrType === "1H" ? 12.5 : 220;
  const xRange = xMax - xMin;

  // Y-axis: Intensity (Normalized 0-1 for visualization)
  const yMin = 0;
  const yMax = 1.05; // Allow slightly more than 1 for peaks touching top
  const yRange = yMax - yMin;


  // --- Generate Visual Curve from Peak Data ---
  let linePath = `M${padding.left},${padding.top + chartHeight}`; // Start path at baseline
  let maxYValue = 0; // To track max generated intensity for normalization

  if (!loading && peakData.length > 0) {
      const resolution = 1000; // Number of points for the curve
      const curvePoints: { x: number; y: number }[] = [];

      for (let i = 0; i <= resolution; i++) {
          // Calculate ppm value for this point (from right to left)
          const currentShift = xMin + (i * (xMax - xMin)) / resolution;
          let totalIntensityAtPoint = 0;

          // Sum contributions from all peaks using a Lorentzian shape
          for (const peak of peakData) {
            // Adjust peak width based on NMR type - narrower for 1H
            const peakWidth = nmrType === "1H" ? 0.02 : 0.5; // In ppm units
            const distance = Math.abs(currentShift - peak.shift);
            // Basic Lorentzian - intensity drops off with distance squared
            // Use peak.intensity as height factor
            const lorentzian = peak.intensity / (1 + Math.pow(distance / peakWidth, 2));
            totalIntensityAtPoint += lorentzian;
          }
          curvePoints.push({ x: currentShift, y: totalIntensityAtPoint });
          if (totalIntensityAtPoint > maxYValue) {
              maxYValue = totalIntensityAtPoint;
          }
      }

      // Normalize Y values and create SVG path string
      if (maxYValue > 0) { // Avoid division by zero
         const svgPoints = curvePoints.map(point => {
            // Normalize intensity (0 to ~1)
            const normalizedY = Math.min(1.0, point.y / maxYValue);
            const svgX = padding.left + chartWidth * (1 - (point.x - xMin) / xRange); // Reversed X-axis
            const svgY = padding.top + chartHeight * (1 - normalizedY / yRange); // Inverted Y-axis, map to yRange
            return `${svgX.toFixed(2)},${svgY.toFixed(2)}`;
         });
         // Start from baseline, go through points, end at baseline
         linePath = `M${padding.left + chartWidth},${padding.top + chartHeight} L${svgPoints.join(" L")} L${padding.left},${padding.top + chartHeight}`;
      }
  }


  // --- Coordinate Mapping Functions ---
  const getX = (shift: number) => padding.left + chartWidth * (1 - (shift - xMin) / xRange); // Reversed
  // Note: We don't have a direct Y mapping from peak data as we generate the curve


  return (
    <div className={className}>
      {/* NMR Type Selection Tabs */}
      <div className="mb-4">
        <Tabs value={nmrType} onValueChange={(value) => setNmrType(value as "1H" | "13C")}>
          {/* Styling tabs for dark mode might need adjustments depending on shadcn setup */}
          <TabsList className="grid grid-cols-2 w-60 bg-gray-700 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <TabsTrigger value="1H">¹H NMR</TabsTrigger>
            <TabsTrigger value="13C">¹³C NMR</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Loading State */}
      {loading && (
         <Card className={cn("bg-gray-800", className)}>
            <CardContent className="p-6 h-[450px] flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Generating {nmrType} NMR spectrum...</p>
              </div>
            </CardContent>
          </Card>
      )}

      {/* Spectrum Display Card */}
      {!loading && (
        <Card className={cn("spectrum-container bg-gray-900 border-gray-700", className)}>
          <CardContent className="p-0 overflow-x-auto">
            <div className="relative">
              <svg width={width} height={height} className="mx-auto block">
                {/* Chart Title */}
                <text
                  x={width / 2} y={padding.top / 2.5}
                  textAnchor="middle" fontSize="16" fontWeight="bold" fill="#E5E7EB"
                >
                  {nmrType} NMR Spectrum {/* Make dynamic if needed */}
                </text>

                {/* Background grid (subtle dark theme) */}
                <g className="grid">
                  {/* Horizontal lines (Y-axis grid) - Fewer needed as Y isn't strictly scaled */}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <line
                      key={`y-grid-${i}`}
                      x1={padding.left} y1={padding.top + (i * chartHeight) / 4}
                      x2={padding.left + chartWidth} y2={padding.top + (i * chartHeight) / 4}
                      stroke="#4B5563" strokeWidth="0.5"
                    />
                  ))}
                  {/* Vertical lines (X-axis grid) */}
                   {Array.from({ length: nmrType === "1H" ? 14 : 12 }).map((_, i) => { // Labels every 1 ppm for 1H, 20 ppm for 13C
                      const shiftInterval = nmrType === "1H" ? 1 : 20;
                      const shiftValue = xMax - i * shiftInterval;
                      if (shiftValue < xMin) return null;
                      const xPos = getX(shiftValue);
                     return (
                        <line
                          key={`x-grid-${i}`}
                          x1={xPos} y1={padding.top}
                          x2={xPos} y2={padding.top + chartHeight}
                          stroke="#4B5563" strokeWidth="0.5"
                        />
                     );
                  })}
                </g>

                {/* X and Y axes */}
                <line
                  x1={padding.left} y1={padding.top + chartHeight}
                  x2={padding.left + chartWidth} y2={padding.top + chartHeight}
                  stroke="#9CA3AF" strokeWidth="1"
                />
                {/* No explicit Y axis line needed if Y isn't scaled */}
                {/* <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#9CA3AF" strokeWidth="1"/> */}


                {/* X axis labels (Chemical Shift) */}
                {Array.from({ length: nmrType === "1H" ? 14 : 12 }).map((_, i) => {
                  const shiftInterval = nmrType === "1H" ? 1 : 20;
                  const shiftValue = xMax - i * shiftInterval;
                  if (shiftValue < xMin || shiftValue > xMax + shiftInterval*0.1) return null; // Check bounds
                  const xPos = getX(shiftValue);
                  return (
                    <g key={`x-label-${i}`}>
                      <text
                        x={xPos} y={padding.top + chartHeight + 20}
                        textAnchor="middle" fontSize="12" fill="#D1D5DB"
                      >
                         {Math.round(shiftValue)}
                      </text>
                    </g>
                  );
                })}
                <text // X Axis Title
                  x={padding.left + chartWidth / 2} y={height - 15}
                  textAnchor="middle" fontSize="14" fill="#D1D5DB"
                >
                  Chemical Shift (ppm)
                </text>

                {/* Y axis title (optional, as scale is relative) */}
                 <text // Y Axis Title
                  x={padding.left - 40} y={padding.top + chartHeight / 2}
                  textAnchor="middle"
                  transform={`rotate(-90 ${padding.left - 40} ${padding.top + chartHeight / 2})`}
                  fontSize="14" fill="#D1D5DB"
                >
                  Relative Intensity
                </text>

                {/* NMR Spectrum Line (Generated Curve) */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#3b82f6" // Blue-500
                  strokeWidth="1.5"
                />

                {/* Peaks Markers (Vertical Lines) and Tooltips */}
                <TooltipProvider>
                   {peakData.map((peak, i) => {
                    const peakX = getX(peak.shift);
                    const normalizedPeakY = Math.min(1.0, (peak.intensity / (maxYValue > 0 ? maxYValue : 1)));
                    const markerY1 = padding.top + chartHeight * (1 - normalizedPeakY / yRange);
                    const markerY2 = padding.top + chartHeight;

                    return (
                      <Tooltip key={`peak-${i}`}>
                        <TooltipTrigger asChild>
                          {/* Wrap the lines in a single <g> element */}
                          <g className="cursor-pointer"> {/* Add cursor pointer to group */}
                            {/* Visible peak line */}
                            <line
                              x1={peakX} y1={markerY1 - 5}
                              x2={peakX} y2={markerY2}
                              stroke="#3b82f6" // Blue-500
                              strokeWidth="1"
                              className="hover:stroke-blue-400"
                              // Make thin line non-interactive so transparent line gets events
                              pointerEvents="none"
                            />
                            {/* Wider transparent line for easier hover/click trigger */}
                            <line
                                x1={peakX} y1={padding.top}
                                x2={peakX} y2={padding.top + chartHeight}
                                stroke="transparent"
                                strokeWidth="6" // Hit area
                            />
                          </g>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 border-gray-600 text-white">
                          <div className="text-xs space-y-0.5">
                            <div className="font-bold">{peak.shift.toFixed(2)} ppm</div>
                            {peak.multiplicity && <div>Mult: {peak.multiplicity}</div>}
                            {peak.coupling > 0 && nmrType === "1H" && !peak.multiplicity.includes('s') && (
                                <div>J ≈ {peak.coupling?.toFixed(1)} Hz</div>
                            )}
                            {peak.assignment && <div className="italic">{peak.assignment}</div>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </TooltipProvider>

                 {/* Reference line for TMS at 0 ppm */}
                  {xMin <= 0 && xMax >= 0 && ( // Only show if 0 ppm is in range
                    <>
                        <line
                          x1={getX(0)} y1={padding.top + chartHeight}
                          x2={getX(0)} y2={padding.top + chartHeight + 5} // Small tick below axis
                          stroke="#9CA3AF" strokeWidth="1"
                        />
                        <text
                          x={getX(0)} y={padding.top - 10}
                          textAnchor="middle" fontSize="10" fill="#9CA3AF"
                        >
                          0
                        </text>
                     </>
                  )}

                 {/* Optional: Solvent residual peak hint (e.g., CDCl3) */}
                 {nmrType === "1H" && xMin <= 7.26 && xMax >= 7.26 && (
                    <text
                      x={getX(7.26)} y={padding.top + chartHeight + 15}
                      textAnchor="middle" fontSize="9" fill="#6B7280"
                      className="opacity-70"
                    >
                      {/* CHCl₃ */}
                    </text>
                 )}
                  {nmrType === "13C" && xMin <= 77 && xMax >= 77 && (
                     <text
                      x={getX(77.16)} y={padding.top + chartHeight + 15} // Standard is ~77.16 triplet
                      textAnchor="middle" fontSize="9" fill="#6B7280"
                      className="opacity-70"
                    >
                       {/* CDCl₃ */}
                     </text>
                  )}

              </svg>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NMRSpectrum;