
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpectrumPlaceholder from "./SpectrumPlaceholder";
import { simulateNMRSpectrum } from "@/lib/spectrum-simulator";

interface NMRSpectrumProps {
  smiles: string;
}

interface NMRPeak {
  shift: number;
  intensity: number;
  multiplicity: string;
  coupling: number;
  assignment: string;
  atomIds: number[];
}

const NMRSpectrum = ({ smiles }: NMRSpectrumProps) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NMRPeak[]>([]);
  const [nmrType, setNmrType] = useState<"1H" | "13C">("1H");
  
  useEffect(() => {
    if (!smiles) {
      setData([]);
      return;
    }
    
    setLoading(true);
    
    // Simulate fetching or calculating spectrum data
    setTimeout(() => {
      const simulatedData = simulateNMRSpectrum(smiles, nmrType);
      setData(simulatedData);
      setLoading(false);
    }, 1000);
  }, [smiles, nmrType]);
  
  if (!smiles) {
    return <SpectrumPlaceholder type="NMR" />;
  }
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating {nmrType} NMR spectrum...</p>
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
  
  // X-axis: chemical shift (reverse order for NMR - higher values on left)
  const xMin = nmrType === "1H" ? 0 : 0;
  const xMax = nmrType === "1H" ? 12 : 220;
  
  // Generate lorentzian peaks for the spectrum
  const resolution = 1000;
  const linePoints = Array.from({ length: resolution }).map((_, i) => {
    const x = xMax - (i * (xMax - xMin)) / resolution;
    
    // Sum up all the peaks at this x position
    let y = 0;
    for (const peak of data) {
      const peakWidth = nmrType === "1H" ? 0.05 : 1;
      const distance = Math.abs(x - peak.shift);
      const lorentzian = peak.intensity / (1 + Math.pow(distance / peakWidth, 2));
      y += lorentzian;
    }
    
    // Normalize y to be between 0 and 1
    y = y > 1 ? 1 : y;
    
    return {
      x,
      y
    };
  });
  
  const points = linePoints.map((point) => {
    const x = padding.left + chartWidth * (1 - (point.x - xMin) / (xMax - xMin));
    const y = padding.top + chartHeight * (1 - point.y);
    return `${x},${y}`;
  });
  
  const linePath = `M${points.join(" L")}`;
  
  return (
    <div>
      <div className="mb-4">
        <Tabs value={nmrType} onValueChange={(value) => setNmrType(value as "1H" | "13C")}>
          <TabsList className="grid grid-cols-2 w-64">
            <TabsTrigger value="1H">¹H NMR</TabsTrigger>
            <TabsTrigger value="13C">¹³C NMR</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
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
                const shift = xMax - (i * (xMax - xMin)) / 12;
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
                      {nmrType === "1H" ? shift.toFixed(1) : Math.round(shift)}
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
                Intensity
              </text>
              
              {/* X axis title */}
              <text
                x={padding.left + chartWidth / 2}
                y={height - 10}
                textAnchor="middle"
                fontSize="14"
                fill="#64748b"
              >
                Chemical Shift (ppm)
              </text>
              
              {/* NMR Spectrum line */}
              <path d={linePath} fill="none" stroke="#1565c0" strokeWidth="2" />
              
              {/* Peaks with tooltips */}
              <TooltipProvider>
                {data.map((peak, i) => {
                  const x = padding.left + chartWidth * (1 - (peak.shift - xMin) / (xMax - xMin));
                  // Position peaks at the bottom of the spectrum
                  const y = padding.top + chartHeight - 5;
                  return (
                    <Tooltip key={`peak-${i}`}>
                      <TooltipTrigger asChild>
                        <line
                          x1={x}
                          y1={y - 10}
                          x2={x}
                          y2={y + 10}
                          stroke="#1565c0"
                          strokeWidth="2"
                          className="peak cursor-pointer"
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm space-y-1">
                          <div className="font-bold">{peak.shift.toFixed(2)} ppm</div>
                          <div>Multiplicity: {peak.multiplicity}</div>
                          {peak.coupling > 0 && nmrType === "1H" && (
                            <div>J = {peak.coupling.toFixed(1)} Hz</div>
                          )}
                          <div>{peak.assignment}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
              
              {/* Reference line for TMS */}
              <line
                x1={padding.left + chartWidth * (1 - (0 - xMin) / (xMax - xMin))}
                y1={padding.top}
                x2={padding.left + chartWidth * (1 - (0 - xMin) / (xMax - xMin))}
                y2={padding.top + chartHeight}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              <text
                x={padding.left + chartWidth * (1 - (0 - xMin) / (xMax - xMin))}
                y={padding.top - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
              >
                TMS
              </text>
              
              {/* Solvent residual peak for chloroform-d */}
              {nmrType === "1H" && (
                <>
                  <line
                    x1={padding.left + chartWidth * (1 - (7.26 - xMin) / (xMax - xMin))}
                    y1={padding.top + chartHeight * 0.7}
                    x2={padding.left + chartWidth * (1 - (7.26 - xMin) / (xMax - xMin))}
                    y2={padding.top + chartHeight}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                  <text
                    x={padding.left + chartWidth * (1 - (7.26 - xMin) / (xMax - xMin))}
                    y={padding.top + chartHeight * 0.65}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    CDCl₃
                  </text>
                </>
              )}
              
              {nmrType === "13C" && (
                <>
                  <line
                    x1={padding.left + chartWidth * (1 - (77 - xMin) / (xMax - xMin))}
                    y1={padding.top + chartHeight * 0.7}
                    x2={padding.left + chartWidth * (1 - (77 - xMin) / (xMax - xMin))}
                    y2={padding.top + chartHeight}
                    stroke="#64748b"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                  <text
                    x={padding.left + chartWidth * (1 - (77 - xMin) / (xMax - xMin))}
                    y={padding.top + chartHeight * 0.65}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#64748b"
                  >
                    CDCl₃
                  </text>
                </>
              )}
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NMRSpectrum;
