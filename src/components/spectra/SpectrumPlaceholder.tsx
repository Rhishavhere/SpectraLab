
import { Card, CardContent } from "@/components/ui/card";

interface SpectrumPlaceholderProps {
  type: "IR" | "UV-Vis" | "NMR";
}

const SpectrumPlaceholder = ({ type }: SpectrumPlaceholderProps) => {
  const colorMap = {
    "IR": "bg-[#89dd4f]/10 border-[#89dd4f] text-[#386f11]",
    "UV-Vis": "bg-uv/10 border-uv text-uv-dark",
    "NMR": "bg-nmr/10 border-nmr text-nmr-dark"
  };
  
  const color = colorMap[type];
  
  return (
    <Card className={`border border-dashed ${color}`}>
      <CardContent className="p-8 h-[400px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="mx-auto rounded-full w-16 h-16 border-2 border-dashed flex items-center justify-center">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium">No {type} Spectrum</h3>
            <p className="mt-1 text-sm">
              Enter a molecule SMILES notation or select one from the library to view the {type} spectrum.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SpectrumPlaceholder;
