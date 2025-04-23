
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IRSpectrum from "./spectra/IRSpectrum";
import UVSpectrum from "./spectra/UVSpectrum";
import NMRSpectrum from "./spectra/NMRSpectrum";
import MoleculeDisplay from "./MoleculeDisplay";

interface SpectroscopyTabsProps {
  smiles: string;
}

const SpectroscopyTabs = ({ smiles }: SpectroscopyTabsProps) => {
  const [activeTab, setActiveTab] = useState("ir");
  
  return (
    <div className="space-y-6">
      <MoleculeDisplay smiles={smiles} />
      
      <Tabs 
        defaultValue="ir" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full mb-4">
          <TabsTrigger value="ir" className="text-base">
            IR Spectrum
          </TabsTrigger>
          <TabsTrigger value="uv" className="text-base">
            UV-Vis Spectrum
          </TabsTrigger>
          <TabsTrigger value="nmr" className="text-base">
            NMR Spectrum
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="ir" className="mt-4">
          <IRSpectrum smiles={smiles} />
        </TabsContent>
        
        <TabsContent value="uv" className="mt-4">
          <UVSpectrum smiles={smiles} />
        </TabsContent>
        
        <TabsContent value="nmr" className="mt-4">
          <NMRSpectrum smiles={smiles} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpectroscopyTabs;
