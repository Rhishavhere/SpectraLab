
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MoleculeDisplayProps {
  smiles: string;
}

const MoleculeDisplay = ({ smiles }: MoleculeDisplayProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  
  useEffect(() => {
    if (smiles) {
      // Using PubChem API to get molecule structure image
      const encodedSmiles = encodeURIComponent(smiles);
      setImageUrl(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG`);
    } else {
      setImageUrl("");
    }
  }, [smiles]);

  if (!smiles) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Enter a molecule SMILES notation or select one from the library
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4 flex justify-center">
        {imageUrl ? (
          <div className="max-w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={`Structure of ${smiles}`}
              className="max-w-full max-h-[200px] object-contain mx-auto"
              onError={() => setImageUrl("/placeholder.svg")}
            />
          </div>
        ) : (
          <div className="h-[200px] w-full flex items-center justify-center">
            <p className="text-muted-foreground">Loading molecule structure...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MoleculeDisplay;
