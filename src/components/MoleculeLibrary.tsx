
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MoleculeLibraryProps {
  onSelectMolecule: (smiles: string, name: string) => void;
}

interface Molecule {
  name: string;
  smiles: string;
  category: string;
}

const commonMolecules: Molecule[] = [
  { name: "Aspirin", smiles: "CC(=O)OC1=CC=CC=C1C(=O)O", category: "Pharmaceutical" },
  { name: "Caffeine", smiles: "CN1C=NC2=C1C(=O)N(C)C(=O)N2C", category: "Natural" },
  { name: "Ibuprofen", smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O", category: "Pharmaceutical" },
  { name: "Ethanol", smiles: "CCO", category: "Common" },
  { name: "Acetone", smiles: "CC(=O)C", category: "Common" },
  { name: "Benzene", smiles: "C1=CC=CC=C1", category: "Common" },
  { name: "Toluene", smiles: "CC1=CC=CC=C1", category: "Common" },
  { name: "Glucose", smiles: "C([C@@H]1[C@H]([C@@H]([C@H](C(O1)O)O)O)O)O", category: "Natural" },
  { name: "Adrenaline", smiles: "CNCC(C1=CC(=C(C=C1)O)O)O", category: "Natural" }
];

const MoleculeLibrary = ({ onSelectMolecule }: MoleculeLibraryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const filteredMolecules = selectedCategory === "all" 
    ? commonMolecules 
    : commonMolecules.filter(m => m.category === selectedCategory);
  
  const categories = ["all", ...Array.from(new Set(commonMolecules.map(m => m.category)))];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Molecule Library</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map((category) => (
            <button
              key={category}
              className={`text-xs px-3 py-1 rounded-full capitalize ${
                selectedCategory === category
                  ? "bg-primary text-white"
                  : "bg-secondary/20 text-secondary-foreground"
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="grid grid-cols-1 gap-2">
            {filteredMolecules.map((molecule) => (
              <button
                key={molecule.smiles}
                className="molecule-card text-left"
                onClick={() => onSelectMolecule(molecule.smiles, molecule.name)}
              >
                <div className="font-medium">{molecule.name}</div>
                <div className="text-xs text-muted-foreground mt-1 truncate">
                  {molecule.smiles}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MoleculeLibrary;
