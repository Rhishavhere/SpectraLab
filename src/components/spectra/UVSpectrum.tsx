import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SpectrumPlaceholder from "./SpectrumPlaceholder";
// Import the specific simulator function and potentially the data structure types
import { simulateUVSpectrum } from "@/lib/spectrum-simulator";
// Import the types directly from the simulator or redefine locally if preferred
import type { UVSpectrumData, UVPeak, UVPoint } from "@/lib/spectrum-simulator";
import { cn } from "@/lib/utils"; // For conditional classes

interface UVSpectrumProps {
  smiles: string;
  className?: string;
}

// Component using the updated simulator output
const UVSpectrum = ({ smiles, className }: UVSpectrumProps) => {
  const [loading, setLoading] = useState(false);
  // State now holds the full UVSpectrumData object or null
  const [spectrumData, setSpectrumData] = useState<UVSpectrumData | null>(null);

  useEffect(() => {
    if (!smiles) {
      setSpectrumData(null);
      return;
    }

    setLoading(true);
    setSpectrumData(null);

    const timer = setTimeout(() => {
      try {
        const simulatedData = simulateUVSpectrum(smiles);
        setSpectrumData(simulatedData);
      } catch (error) {
        console.error("Error simulating UV-Vis spectrum:", error);
        setSpectrumData(null);
      } finally {
        setLoading(false);
      }
    }, 500); // Consistent timeout

    return () => clearTimeout(timer);

  }, [smiles]);

  // --- Render Logic ---

  if (!smiles) {
    return <SpectrumPlaceholder type="UV-Vis" />;
  }

  if (loading) {
    return (
      <Card className={cn("bg-gray-800", className)}>
        <CardContent className="p-6 h-[450px] flex items-center justify-center">
          <div className="text-center">
            {/* Using a different color for UV loading spinner */}
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Generating UV-Vis spectrum...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!spectrumData || !spectrumData.spectrum || spectrumData.spectrum.length === 0) {
     return <SpectrumPlaceholder type="UV-Vis" message="Could not generate spectrum data." />;
  }

  // --- Chart Setup ---
  const width = 800;
  const height = 450;
  const padding = { top: 50, right: 40, bottom: 85, left: 60 }; // Increased bottom for visible spectrum bar
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X-axis: Wavelength (nm)
  const xMin = 200;
  const xMax = 800; // Standard range
  const xRange = xMax - xMin;

  // Y-axis: Absorbance (AU)
  const yMin = 0;
  // Determine max absorbance dynamically from the spectrum data, adding a small buffer
  // Or use a fixed max like 1.5 or 2.0 for consistency across different spectra
  const calculatedYMax = Math.max(...spectrumData.spectrum.map(p => p.absorbance), 0.1); // Ensure at least 0.1
  const yMax = Math.ceil(calculatedYMax * 1.2 * 10) / 10; // Add 20% buffer, round up to nearest 0.1
  // const yMax = 1.5; // --- Alternative: Use a fixed maximum ---
  const yRange = yMax - yMin;


  // --- Coordinate Mapping Functions ---
  const getX = (wavelength: number) => padding.left + chartWidth * ((wavelength - xMin) / xRange);
  const getY = (absorbance: number) => padding.top + chartHeight * (1 - (absorbance - yMin) / yRange);

  // --- Generate SVG Path for the Spectrum Curve ---
  const linePath = `M${spectrumData.spectrum
    .map(point => `${getX(point.wavelength).toFixed(2)},${getY(point.absorbance).toFixed(2)}`)
    .join(" L")}`;

  // --- Prepare Peaks for Markers/Labels ---
  // Filter peaks to only show those within the plotted y-range if needed (though usually they define the range)
  const renderedPeaks = spectrumData.peaks
    .filter(peak => peak.wavelength >= xMin && peak.wavelength <= xMax && peak.absorbance > yMin) // Ensure within plot bounds
    .map(peak => ({
        ...peak,
        x: getX(peak.wavelength),
        y: getY(peak.absorbance),
    }));

  // --- Visible Spectrum Bar Calculation ---
  const visibleMin = 380;
  const visibleMax = 750;
  const visibleBarX = getX(Math.max(xMin, visibleMin));
  const visibleBarWidth = getX(Math.min(xMax, visibleMax)) - visibleBarX;


  return (
    <Card className={cn("spectrum-container bg-gray-900 border-gray-700", className)}>
      <CardContent className="p-0 overflow-x-auto">
        <div className="relative">
          <svg width={width} height={height} className="mx-auto block">
            {/* Chart Title */}
            <text
              x={width / 2}
              y={padding.top / 2.5}
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill="#E5E7EB"
            >
              UV-Vis Spectrum {/* Make dynamic if needed */}
            </text>

            {/* Background grid (subtle dark theme) */}
            <g className="grid">
              {/* Horizontal lines (Y-axis grid) - Adjust count based on yMax */}
              {Array.from({ length: Math.max(5, Math.ceil(yMax / 0.2)) + 1 }).map((_, i) => {
                 const yValue = yMin + i * (yRange / Math.max(5, Math.ceil(yMax / 0.2)));
                 if (yValue > yMax) return null;
                 const yPos = getY(yValue);
                 return (
                    <line
                      key={`y-grid-${i}`}
                      x1={padding.left} y1={yPos}
                      x2={padding.left + chartWidth} y2={yPos}
                      stroke="#4B5563" strokeWidth="0.5"
                    />
                 );
              })}
              {/* Vertical lines (X-axis grid) */}
              {Array.from({ length: 13 }).map((_, i) => { // Every 50nm
                 const wavelength = xMin + i * 50;
                 if (wavelength > xMax) return null;
                 const xPos = getX(wavelength);
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
            <line
              x1={padding.left} y1={padding.top}
              x2={padding.left} y2={padding.top + chartHeight}
              stroke="#9CA3AF" strokeWidth="1"
            />

            {/* X axis labels (Wavelength) */}
            {Array.from({ length: 7 }).map((_, i) => { // Every 100nm
              const wavelength = xMin + i * 100;
              if (wavelength > xMax) return null;
              const xPos = getX(wavelength);
              return (
                <g key={`x-label-${i}`}>
                  <text
                    x={xPos} y={padding.top + chartHeight + 20}
                    textAnchor="middle" fontSize="12" fill="#D1D5DB"
                  >
                    {wavelength}
                  </text>
                </g>
              );
            })}
            <text // X Axis Title
              x={padding.left + chartWidth / 2} y={height - padding.bottom + 45} // Adjusted y pos
              textAnchor="middle" fontSize="14" fill="#D1D5DB"
            >
              Wavelength (nm)
            </text>

            {/* Y axis labels (Absorbance) */}
             {Array.from({ length: Math.max(5, Math.ceil(yMax / 0.2)) + 1 }).map((_, i) => { // Labels match grid lines
                 const yValue = yMin + i * (yRange / Math.max(5, Math.ceil(yMax / 0.2)));
                 if (yValue > yMax + 1e-6) return null; // Add tolerance for float issues
                 const yPos = getY(yValue);
                 return (
                    <g key={`y-label-${i}`}>
                      <text
                        x={padding.left - 15} y={yPos}
                        textAnchor="end" dominantBaseline="middle"
                        fontSize="12" fill="#D1D5DB"
                      >
                        {yValue.toFixed(1)} {/* One decimal place for Abs */}
                      </text>
                    </g>
                 );
             })}
             <text // Y Axis Title
              x={padding.left - 40} y={padding.top + chartHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 ${padding.left - 40} ${padding.top + chartHeight / 2})`}
              fontSize="14" fill="#D1D5DB"
            >
              Absorbance (AU)
            </text>

            {/* UV-Vis Spectrum line */}
            <path
              d={linePath}
              fill="none"
              stroke="#a855f7" // Purple-500
              strokeWidth="1.5"
            />

            {/* UV-Vis Peaks markers and tooltips */}
            <TooltipProvider>
              {renderedPeaks.map((peak, i) => {
                // Skip rendering marker if peak is too low (e.g., essentially baseline)
                 if (peak.absorbance < yMin + yRange * 0.02) return null;

                 const markerRadius = 3;
                 // Simple label positioning: place above if high, below if low? Or always above? Let's try always above.
                 const labelYOffset = -15;
                 const showLabel = peak.absorbance > yRange * 0.1; // Only label reasonably intense peaks directly

                return (
                  <g key={`peak-group-${i}`}>
                    {/* Optional: Line pointer from marker if label shown */}
                     {showLabel && (
                        <line
                            x1={peak.x} y1={peak.y - markerRadius}
                            x2={peak.x} y2={peak.y + labelYOffset + 5} // Line ends below text
                            stroke="#a855f7" // Purple
                            strokeWidth="0.5"
                            strokeDasharray="2 2" // Dashed line
                        />
                     )}
                    {/* Optional: Text Label directly on chart */}
                     {showLabel && (
                        <text
                            x={peak.x} y={peak.y + labelYOffset}
                            textAnchor="middle" fontSize="10" fill="#FFFFFF"
                        >
                            {`${peak.wavelength.toFixed(0)} nm`}
                        </text>
                     )}
                    {/* Tooltip Trigger (Circle Marker) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <circle
                          cx={peak.x}
                          cy={peak.y}
                          r={markerRadius}
                          fill="#a855f7" // Purple marker fill
                          stroke="#FFFFFF" // White border
                          strokeWidth="0.5"
                          className="cursor-pointer hover:opacity-80"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-gray-600 text-white">
                        <div className="text-xs">
                          <div className="font-bold">λmax: {peak.wavelength.toFixed(0)} nm</div>
                          <div>Absorbance: {peak.absorbance.toFixed(2)} AU</div>
                          <div className="italic">{peak.transition}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </g>
                );
              })}
            </TooltipProvider>


             {/* Visible Spectrum Bar */}
             <defs>
              <linearGradient id="uvVisGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                {/* Adjusted gradient stops for better color representation */}
                <stop offset="0%" stopColor="#A000C0" />    {/* Violet */}
                <stop offset="15%" stopColor="#0000FF" />   {/* Blue */}
                <stop offset="35%" stopColor="#00A0A0" />   {/* Cyan */}
                <stop offset="50%" stopColor="#00C000" />   {/* Green */}
                <stop offset="65%" stopColor="#E0E000" />   {/* Yellow */}
                <stop offset="85%" stopColor="#FF8000" />   {/* Orange */}
                <stop offset="100%" stopColor="#FF0000" />  {/* Red */}
              </linearGradient>
            </defs>
            {/* Only draw bar if it has positive width */}
             {visibleBarWidth > 0 && (
                <rect
                    x={visibleBarX}
                    y={padding.top + chartHeight + 10} // Position below axis
                    width={visibleBarWidth}
                    height={10}
                    fill="url(#uvVisGradient)"
                    stroke="#6B7280" // Gray border
                    strokeWidth="0.5"
                />
             )}
             {/* Labels for Visible Bar */}
             {visibleBarWidth > 0 && (
                <>
                    <text
                      x={visibleBarX} y={padding.top + chartHeight + 30}
                      textAnchor="middle" fontSize="10" fill="#9CA3AF"
                    >
                      {visibleMin}
                    </text>
                    <text
                      x={visibleBarX + visibleBarWidth} y={padding.top + chartHeight + 30}
                      textAnchor="middle" fontSize="10" fill="#9CA3AF"
                    >
                      {visibleMax}
                    </text>
                     <text
                      x={visibleBarX + visibleBarWidth / 2} y={padding.top + chartHeight + 30}
                      textAnchor="middle" fontSize="10" fill="#9CA3AF"
                    >
                      Visible Range
                    </text>
                </>
             )}

          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default UVSpectrum;