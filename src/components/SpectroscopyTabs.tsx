import IRSpectrum from "./spectra/IRSpectrum";
import UVSpectrum from "./spectra/UVSpectrum";
import NMRSpectrum from "./spectra/NMRSpectrum";
import MoleculeDisplay from "./MoleculeDisplay";

interface SpectroscopyDisplayProps {
  smiles: string;
}

const SpectroscopyDisplay = ({ smiles }: SpectroscopyDisplayProps) => {
  return (
    <div className="space-y-6">
      <MoleculeDisplay smiles={smiles} />
      <div className="text-2xl font-semibold">Spectral Data </div>
      <div className="mt-4">
        <div className="font-semibold mb-2">IR Spectrum</div>
        <IRSpectrum smiles={smiles} />
      </div>
      <div className="mt-4">
        <div className="font-semibold mb-2">UV-Vis Spectrum</div>
        <UVSpectrum smiles={smiles} />
      </div>
      <div className="mt-4">
        <div className="font-semibold mb-2">NMR Spectrum</div>
        <NMRSpectrum smiles={smiles} />
      </div>
    </div>
  );
};

export default SpectroscopyDisplay;