
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
    <div className="container mx-auto py-8 px-4">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">
          Spectroscopy Simulator
        </h1>
        <p className="text-muted-foreground">
          Simulate IR, UV-Vis and NMR spectra for molecules
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
