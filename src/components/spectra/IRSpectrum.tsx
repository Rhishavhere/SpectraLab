import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
// Assuming Tooltip components are correctly imported from shadcn/ui
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SpectrumPlaceholder from "./SpectrumPlaceholder";
// Make sure this path is correct and points to the *updated* simulator code
import { simulateIRSpectrum } from "@/lib/spectrum-simulator";
import { cn } from "@/lib/utils"; // For conditional classes

// --- Interfaces (should match the simulator output) ---
interface IRSpectrumPeak {
  wavenumber: number;
  transmittance: number; // Note: using transmittance now
  assignment: string;
}

interface IRSpectrumData {
  spectrum: [number, number][]; // [wavenumber, transmittance] points
  peaks: IRSpectrumPeak[];     // Key peaks for labeling
}

interface IRSpectrumProps {
  smiles: string;
  className?: string;
}

// --- Component ---
const IRSpectrum = ({ smiles, className }: IRSpectrumProps) => {
  const [loading, setLoading] = useState(false);
  // State now holds the full spectrum data object or null
  const [spectrumData, setSpectrumData] = useState<IRSpectrumData | null>(null);

  useEffect(() => {
    if (!smiles) {
      setSpectrumData(null); // Clear data if no SMILES
      return;
    }

    setLoading(true);
    setSpectrumData(null); // Clear previous data while loading

    // Simulate fetching or calculating spectrum data
    // Use a try-catch block in a real scenario
    const timer = setTimeout(() => {
      try {
         // Call the *updated* simulator function
        const simulatedData = simulateIRSpectrum(smiles);
        setSpectrumData(simulatedData);
      } catch (error) {
        console.error("Error simulating IR spectrum:", error);
        setSpectrumData(null); // Ensure data is cleared on error
      } finally {
        setLoading(false);
      }
    }, 500); // Reduced timeout slightly

    return () => clearTimeout(timer); // Cleanup timer on unmount or re-run

  }, [smiles]);

  // --- Render Logic ---

  if (!smiles) {
    return <SpectrumPlaceholder type="IR" />;
  }

  if (loading) {
    return (
      <Card className={cn("bg-gray-800", className)}> {/* Dark background for loading */}
        <CardContent className="p-6 h-[450px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div> {/* Adjusted color */}
            <p className="text-gray-400">Generating IR spectrum...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle cases where simulation might fail or return no data
  if (!spectrumData || !spectrumData.spectrum || spectrumData.spectrum.length === 0) {
     return <SpectrumPlaceholder type="IR" message="Could not generate spectrum data." />;
  }

  // Chart dimensions and scales (adjust height slightly for labels)
  const width = 800;
  const height = 450; // Increased height a bit
  const padding = { top: 50, right: 40, bottom: 60, left: 60 }; // Increased top padding for labels
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // X-axis: wavenumbers (reverse order for IR - higher values on left)
  const xMin = 400;
  const xMax = 4000;
  const xRange = xMax - xMin;

  // Y-axis: transmittance (0-100, 100 at top)
  const yMin = 0;
  const yMax = 100;
  const yRange = yMax - yMin;

  // Function to map data coords to SVG coords
  const getX = (wavenumber: number) => padding.left + chartWidth * (1 - (wavenumber - xMin) / xRange);
  const getY = (transmittance: number) => padding.top + chartHeight * (1 - (transmittance - yMin) / yRange);

  // Generate path for the *detailed* spectrum line from spectrumData.spectrum
  const linePath = `M${spectrumData.spectrum
    .map(([wavenumber, transmittance]) => `${getX(wavenumber).toFixed(2)},${getY(transmittance).toFixed(2)}`)
    .join(" L")}`;

  // Prepare peak data for rendering labels and markers
  const renderedPeaks = spectrumData.peaks.map(peak => ({
    ...peak,
    x: getX(peak.wavenumber),
    y: getY(peak.transmittance),
  }));

  return (
    <Card className={cn("spectrum-container bg-gray-900 border-gray-700", className)}> {/* Dark theme background */}
      <CardContent className="p-0 overflow-x-auto">
        <div className="relative">
          <svg width={width} height={height} className="mx-auto block"> {/* Ensure block display */}
            {/* Chart Title */}
            <text
              x={width / 2}
              y={padding.top / 2.5} // Position title within top padding
              textAnchor="middle"
              fontSize="16"
              fontWeight="bold"
              fill="#E5E7EB" // Light gray text
            >
              IR Spectrum of Acetone {/* Make dynamic if needed */}
            </text>

            {/* Background grid (subtle dark theme) */}
            <g className="grid">
              {/* Horizontal lines (Y-axis grid) */}
              {Array.from({ length: 11 }).map((_, i) => (
                <line
                  key={`y-grid-${i}`}
                  x1={padding.left}
                  y1={padding.top + (i * chartHeight) / 10}
                  x2={padding.left + chartWidth}
                  y2={padding.top + (i * chartHeight) / 10}
                  stroke="#4B5563" // Darker gray grid lines
                  strokeWidth="0.5" // Thinner lines
                />
              ))}
              {/* Vertical lines (X-axis grid) */}
              {/* More lines for finer grid like the example */}
              {Array.from({ length: 19 }).map((_, i) => { // (4000-400)/200 = 18 sections -> 19 lines
                 const wavenumber = xMax - i * 200;
                 if (wavenumber < xMin) return null; // Don't draw outside range
                 const xPos = getX(wavenumber);
                return (
                  <line
                    key={`x-grid-${i}`}
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={padding.top + chartHeight}
                    stroke="#4B5563" // Darker gray grid lines
                    strokeWidth="0.5" // Thinner lines
                  />
                );
              })}
            </g>

            {/* X and Y axes */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight} // Bottom axis line
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#9CA3AF" // Medium gray axis lines
              strokeWidth="1"
            />
            <line
              x1={padding.left}
              y1={padding.top}             // Left axis line
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#9CA3AF" // Medium gray axis lines
              strokeWidth="1"
            />

            {/* X axis labels (Wavenumber) */}
            {Array.from({ length: 10 }).map((_, i) => { // Labels every 400 cm-1 (adjust as needed)
              const wavenumber = xMax - i * 400;
               if (wavenumber < xMin) return null;
              const xPos = getX(wavenumber);
              return (
                <g key={`x-label-${i}`}>
                  {/* Tick mark (optional) */}
                  {/* <line x1={xPos} y1={padding.top + chartHeight} x2={xPos} y2={padding.top + chartHeight + 4} stroke="#9CA3AF" strokeWidth="1"/> */}
                  <text
                    x={xPos}
                    y={padding.top + chartHeight + 20} // Position below axis line
                    textAnchor="middle"
                    fontSize="12"
                    fill="#D1D5DB" // Lighter gray text
                  >
                    {wavenumber}
                  </text>
                </g>
              );
            })}
            <text // X Axis Title
              x={padding.left + chartWidth / 2}
              y={height - 15} // Position near bottom
              textAnchor="middle"
              fontSize="14"
              fill="#D1D5DB"
            >
              Wavenumber (cm⁻¹)
            </text>

            {/* Y axis labels (Transmittance) */}
            {Array.from({ length: 6 }).map((_, i) => { // Labels every 20%
              const transmittance = yMax - i * 20;
              const yPos = getY(transmittance);
              return (
                <g key={`y-label-${i}`}>
                   {/* Tick mark (optional) */}
                  {/* <line x1={padding.left - 4} y1={yPos} x2={padding.left} y2={yPos} stroke="#9CA3AF" strokeWidth="1"/> */}
                  <text
                    x={padding.left - 15} // Position left of axis line
                    y={yPos}
                    textAnchor="end"
                    dominantBaseline="middle" // Align text vertically
                    fontSize="12"
                    fill="#D1D5DB"
                  >
                    {transmittance}
                  </text>
                </g>
              );
            })}
             <text // Y Axis Title
              x={padding.left - 40} // Position further left
              y={padding.top + chartHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 ${padding.left - 40} ${padding.top + chartHeight / 2})`} // Rotate
              fontSize="14"
              fill="#D1D5DB"
            >
              Transmittance (%)
            </text>

            {/* IR Spectrum line (using the detailed path) */}
            <path
              d={linePath}
              fill="none"
              stroke="#F87171" // Brighter Red like the example (Tailwind red-400)
              strokeWidth="1.5" // Slightly thicker or thinner as desired
            />

            {/* Peaks markers, lines, and text labels */}
            <TooltipProvider>
              {renderedPeaks.map((peak, i) => {
                const labelYOffset = -25; // How far above the line end the text appears
                const lineEndYOffset = -5; // How far above the marker the line ends
                const markerRadius = 3; // Smaller marker

                return (
                  <g key={`peak-group-${i}`}>
                    {/* Line pointing from marker upwards */}
                    <line
                      x1={peak.x}
                      y1={peak.y - markerRadius} // Start slightly above marker center
                      x2={peak.x}
                      y2={peak.y + lineEndYOffset} // End above the marker
                      stroke="#F87171" // Red line
                      strokeWidth="1"
                    />
                    {/* Text Label */}
                    <text
                      x={peak.x}
                      y={peak.y + lineEndYOffset + labelYOffset} // Position above the line end
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="medium"
                      fill="#FFFFFF" // White text
                    >
                      {peak.assignment}
                    </text>
                    {/* Tooltip Trigger (Circle Marker) - Render last so it's on top for clicks */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <circle
                          cx={peak.x}
                          cy={peak.y}
                          r={markerRadius}
                          fill="#F87171" // Red marker fill
                          stroke="#FFFFFF" // White border for visibility
                          strokeWidth="0.5"
                          className="cursor-pointer hover:opacity-80"
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-gray-800 border-gray-600 text-white"> {/* Dark tooltip */}
                        <div className="text-xs">
                          <div className="font-bold">{peak.wavenumber.toFixed(0)} cm⁻¹</div>
                          <div>Transmittance: {peak.transmittance.toFixed(1)}%</div>
                          <div className="italic">{peak.assignment}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </g>
                );
              })}
            </TooltipProvider>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default IRSpectrum;