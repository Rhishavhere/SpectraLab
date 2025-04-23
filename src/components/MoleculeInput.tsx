
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface MoleculeInputProps {
  molecule: string;
  setMolecule: (smiles: string) => void;
  setMoleculeName: (name: string) => void;
}

const MoleculeInput = ({ molecule, setMolecule, setMoleculeName }: MoleculeInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [inputName, setInputName] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      toast({
        title: "Input Error",
        description: "Please enter a valid SMILES notation",
        variant: "destructive",
      });
      return;
    }
    
    setMolecule(inputValue);
    setMoleculeName(inputName || "Custom Molecule");
    toast({
      title: "Molecule Updated",
      description: `SMILES: ${inputValue}`,
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Enter Molecule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="molecule-name" className="text-sm font-medium">
              Molecule Name
            </label>
            <Input
              id="molecule-name"
              placeholder="e.g., Aspirin, Caffeine"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="smiles" className="text-sm font-medium">
              SMILES Notation
            </label>
            <Input
              id="smiles"
              placeholder="e.g., CC(=O)OC1=CC=CC=C1C(=O)O"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Simplified Molecular Input Line Entry System
            </p>
          </div>
          
          <Button type="submit" className="w-full">
            Generate Spectra
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default MoleculeInput;
