
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SpectrumPlaceholder from "./SpectrumPlaceholder";
import { simulateUVSpectrum } from "@/lib/spectrum-simulator";

interface UVSpectrumProps {
  smiles: string;
}

interface UVPeak {
  wavelength: number;
  absorbance: number;
  transition: string;
}

const UVSpectrum = ({ smiles }: UVSpectrumProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UVPeak[]>([]);
  
  useEffect(() => {
    if (!smiles) {
      setData([]);
      return;
    }
    
    setLoading(true);
    
    // Simulate fetching or calculating spectrum data
    setTimeout(() => {
      const simulatedData = simulateUVSpectrum(smiles);
      setData(simulatedData);
      setLoading(false);
    }, 800);
  }, [smiles]);
  
  if (!smiles) {
    return <SpectrumPlaceholder type="UV-Vis" />;
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating UV-Vis spectrum...</p>
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
  
  // X-axis: wavelength
  const xMin = 200;
  const xMax = 800;
  
  // Generate path for the spectrum
  const points = data.map((point) => {
    const x = padding.left + chartWidth * ((point.wavelength - xMin) / (xMax - xMin));
    const y = padding.top + chartHeight * (1 - point.absorbance);
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
            {Array.from({ length: 7 }).map((_, i) => {
              const xPos = padding.left + (i * chartWidth) / 6;
              const wavelength = xMin + (i * (xMax - xMin)) / 6;
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
                    {Math.round(wavelength)}
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
              Absorbance
            </text>
            
            {/* X axis title */}
            <text
              x={padding.left + chartWidth / 2}
              y={height - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#64748b"
            >
              Wavelength (nm)
            </text>
            
            {/* UV-Vis Spectrum line */}
            <path d={linePath} fill="none" stroke="#8e24aa" strokeWidth="2" />
            
            {/* UV-Vis peaks with tooltips */}
            <TooltipProvider>
              {data.map((peak, i) => {
                const x = padding.left + chartWidth * ((peak.wavelength - xMin) / (xMax - xMin));
                const y = padding.top + chartHeight * (1 - peak.absorbance);
                return (
                  <Tooltip key={`peak-${i}`}>
                    <TooltipTrigger asChild>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill="#8e24aa"
                        className="peak cursor-pointer"
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <div className="font-bold">{peak.wavelength} nm</div>
                        <div>Transition: {peak.transition}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
            
            {/* Visual spectrum */}
            <defs>
              <linearGradient id="uvVisGradient" x1="0%" y1="0%" x2="100%" y1="0%">
                <stop offset="0%" stopColor="#9c27b0" />
                <stop offset="16.67%" stopColor="#3f51b5" />
                <stop offset="33.33%" stopColor="#2196f3" />
                <stop offset="50%" stopColor="#4caf50" />
                <stop offset="66.67%" stopColor="#ffeb3b" />
                <stop offset="83.33%" stopColor="#ff9800" />
                <stop offset="100%" stopColor="#f44336" />
              </linearGradient>
            </defs>
            <rect
              x={padding.left + chartWidth * ((380 - xMin) / (xMax - xMin))}
              y={padding.top + chartHeight + 30}
              width={chartWidth * ((750 - 380) / (xMax - xMin))}
              height={10}
              fill="url(#uvVisGradient)"
            />
            <text
              x={padding.left + chartWidth * ((380 - xMin) / (xMax - xMin))}
              y={padding.top + chartHeight + 55}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              380
            </text>
            <text
              x={padding.left + chartWidth * ((750 - xMin) / (xMax - xMin))}
              y={padding.top + chartHeight + 55}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              750
            </text>
            <text
              x={padding.left + chartWidth * (((380 + 750) / 2 - xMin) / (xMax - xMin))}
              y={padding.top + chartHeight + 55}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              Visible
            </text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default UVSpectrum;
