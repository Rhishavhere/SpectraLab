
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SpectrumPlaceholder from "./SpectrumPlaceholder";
import { simulateIRSpectrum } from "@/lib/spectrum-simulator";

interface IRSpectrumProps {
  smiles: string;
}

interface IRPeak {
  wavenumber: number;
  intensity: number;
  assignment: string;
}

const IRSpectrum = ({ smiles }: IRSpectrumProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IRPeak[]>([]);
  
  useEffect(() => {
    if (!smiles) {
      setData([]);
      return;
    }
    
    setLoading(true);
    
    // Simulate fetching or calculating spectrum data
    setTimeout(() => {
      const simulatedData = simulateIRSpectrum(smiles);
      setData(simulatedData);
      setLoading(false);
    }, 800);
  }, [smiles]);
  
  if (!smiles) {
    return <SpectrumPlaceholder type="IR" />;
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating IR spectrum...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Chart dimensions and scales
  const width = 800;
  const height = 400;
  const padding = { top: 40, right: 40, bottom: 60, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  // X-axis: wavenumbers (reverse order for IR - higher values on left)
  const xMin = 400;
  const xMax = 4000;
  
  // Generate path for the spectrum
  const points = data.map((point) => {
    const x = padding.left + chartWidth * (1 - (point.wavenumber - xMin) / (xMax - xMin));
    const y = padding.top + chartHeight * (1 - point.intensity);
    return `${x},${y}`;
  });
  
  const linePath = `M${points.join(" L")}`;
  
  return (
    <Card className="spectrum-container">
      <CardContent className="p-0 overflow-x-auto">
        <div className="relative">
          <svg width={width} height={height} className="mx-auto">
            {/* Background grid */}
            <g className="grid">
              {Array.from({ length: 11 }).map((_, i) => (
                <line
                  key={`x-grid-${i}`}
                  x1={padding.left}
                  y1={padding.top + (i * chartHeight) / 10}
                  x2={padding.left + chartWidth}
                  y2={padding.top + (i * chartHeight) / 10}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />
              ))}
              {Array.from({ length: 13 }).map((_, i) => {
                const xPos = padding.left + (i * chartWidth) / 12;
                return (
                  <line
                    key={`y-grid-${i}`}
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={padding.top + chartHeight}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                );
              })}
            </g>
            
            {/* X and Y axes */}
            <line
              x1={padding.left}
              y1={padding.top + chartHeight}
              x2={padding.left + chartWidth}
              y2={padding.top + chartHeight}
              stroke="#64748b"
              strokeWidth="2"
            />
            <line
              x1={padding.left}
              y1={padding.top}
              x2={padding.left}
              y2={padding.top + chartHeight}
              stroke="#64748b"
              strokeWidth="2"
            />
            
            {/* X axis labels */}
            {Array.from({ length: 13 }).map((_, i) => {
              const xPos = padding.left + (i * chartWidth) / 12;
              const wavenumber = xMax - (i * (xMax - xMin)) / 12;
              return (
                <g key={`x-label-${i}`}>
                  <line
                    x1={xPos}
                    y1={padding.top + chartHeight}
                    x2={xPos}
                    y2={padding.top + chartHeight + 5}
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                  <text
                    x={xPos}
                    y={padding.top + chartHeight + 25}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#64748b"
                  >
                    {Math.round(wavenumber)}
                  </text>
                </g>
              );
            })}
            
            {/* Y axis labels */}
            <text
              x={padding.left - 35}
              y={padding.top + chartHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90 ${padding.left - 35} ${
                padding.top + chartHeight / 2
              })`}
              fontSize="14"
              fill="#64748b"
            >
              Transmittance (%)
            </text>
            
            {/* X axis title */}
            <text
              x={padding.left + chartWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#64748b"
            >
              Wavenumber (cm⁻¹)
            </text>
            
            {/* IR Spectrum line */}
            <path d={linePath} fill="none" stroke="#e53935" strokeWidth="2" />
            
            {/* Peaks with tooltips */}
            <TooltipProvider>
              {data.map((peak, i) => {
                const x = padding.left + chartWidth * (1 - (peak.wavenumber - xMin) / (xMax - xMin));
                const y = padding.top + chartHeight * (1 - peak.intensity);
                return (
                  <Tooltip key={`peak-${i}`}>
                    <TooltipTrigger asChild>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#e53935"
                        className="peak cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-bold">{peak.wavenumber} cm⁻¹</div>
                        <div>{peak.assignment}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
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
