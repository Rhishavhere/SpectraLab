import { useState } from "react";
import MoleculeInput from "@/components/MoleculeInput";
import SpectroscopyTabs from "@/components/SpectroscopyTabs";
import MoleculeLibrary from "@/components/MoleculeLibrary";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [molecule, setMolecule] = useState("");
  const [moleculeName, setMoleculeName] = useState("");
  const { toast } = useToast();

  const handleMoleculeSelect = (smiles: string, name: string) => {
    setMolecule(smiles);
    setMoleculeName(name);
    toast({
      title: "Molecule Selected",
      description: `${name} (${smiles})`,
    });
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <header className="text-center mb-4 space-y-1">
        <div className="inline-block">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            SpectraLab
          </h1>
        </div>
        <div className="max-w-2xl mx-auto space-y-6">
          <p className="text-xl text-muted-foreground">
            Advanced spectral analysis with AI
          </p>
          <p className="text-sm text-muted-foreground/80 italic">
            Simulate and analyze IR, UV-Vis, and NMR spectra for any molecule instantly
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ... existing code ... */}
        <div className="md:col-span-1">
          <div className="sticky top-4">
            <MoleculeInput 
              molecule={molecule} 
              setMolecule={setMolecule} 
              setMoleculeName={setMoleculeName} 
            />
            <MoleculeLibrary onSelectMolecule={handleMoleculeSelect} />
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-card rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">
              {moleculeName || "Spectral Data"}
            </h2>
            <SpectroscopyTabs smiles={molecule} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;