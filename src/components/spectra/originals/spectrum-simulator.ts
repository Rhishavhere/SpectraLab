
// This is a simple simulation library for spectroscopy data
// In a real application, this would use proper chemistry libraries or APIs

interface IRPeak {
  wavenumber: number;
  intensity: number;
  assignment: string;
}

interface UVPeak {
  wavelength: number;
  absorbance: number;
  transition: string;
}

interface NMRPeak {
  shift: number;
  intensity: number;
  multiplicity: string;
  coupling: number;
  assignment: string;
  atomIds: number[];
}

// Helper function to determine molecular features from SMILES
const analyzeMolecule = (smiles: string) => {
  // This is a very simplified detection. A real implementation would
  // use a proper chemistry library or API to analyze the molecule
  const features = {
    hasOH: smiles.includes("O"),
    hasNH: smiles.includes("N"),
    hasCarbonyl: smiles.includes("C(=O)") || smiles.includes("C=O"),
    hasAlkene: smiles.includes("C=C"),
    hasAromatic: smiles.includes("c1") || smiles.includes("C1=CC=CC=C1"),
    hasAlkyne: smiles.includes("C#C"),
    hasEster: smiles.includes("C(=O)O") || smiles.includes("OC=O"),
    hasAmide: smiles.includes("C(=O)N") || smiles.includes("NC=O"),
    hasCarbonComplexity: smiles.length > 20,
  };
  return features;
};

// Simulate IR spectrum based on SMILES
export const simulateIRSpectrum = (smiles: string): IRPeak[] => {
  const features = analyzeMolecule(smiles);
  const peaks: IRPeak[] = [];

  // Add some common IR peaks based on functional groups
  if (features.hasOH) {
    peaks.push({
      wavenumber: 3300 + Math.random() * 100,
      intensity: 0.7 + Math.random() * 0.3,
      assignment: "O-H stretch"
    });
  }

  if (features.hasNH) {
    peaks.push({
      wavenumber: 3400 + Math.random() * 100,
      intensity: 0.5 + Math.random() * 0.3,
      assignment: "N-H stretch"
    });
  }

  if (features.hasCarbonyl) {
    peaks.push({
      wavenumber: 1700 + Math.random() * 50,
      intensity: 0.8 + Math.random() * 0.2,
      assignment: "C=O stretch"
    });
  }

  if (features.hasAlkene) {
    peaks.push({
      wavenumber: 1650 + Math.random() * 50,
      intensity: 0.6 + Math.random() * 0.2,
      assignment: "C=C stretch"
    });
  }

  if (features.hasAromatic) {
    peaks.push({
      wavenumber: 3030 + Math.random() * 30,
      intensity: 0.4 + Math.random() * 0.3,
      assignment: "Aromatic C-H stretch"
    });
    
    peaks.push({
      wavenumber: 1600 + Math.random() * 30,
      intensity: 0.5 + Math.random() * 0.3,
      assignment: "Aromatic C=C stretch"
    });
    
    peaks.push({
      wavenumber: 750 + Math.random() * 50,
      intensity: 0.6 + Math.random() * 0.2,
      assignment: "Aromatic C-H out-of-plane bending"
    });
  }

  if (features.hasEster) {
    peaks.push({
      wavenumber: 1735 + Math.random() * 30,
      intensity: 0.85 + Math.random() * 0.15,
      assignment: "Ester C=O stretch"
    });
    
    peaks.push({
      wavenumber: 1200 + Math.random() * 50,
      intensity: 0.7 + Math.random() * 0.2,
      assignment: "C-O stretch"
    });
  }

  if (features.hasAmide) {
    peaks.push({
      wavenumber: 1650 + Math.random() * 30,
      intensity: 0.75 + Math.random() * 0.2,
      assignment: "Amide C=O stretch (Amide I)"
    });
    
    peaks.push({
      wavenumber: 1550 + Math.random() * 30,
      intensity: 0.6 + Math.random() * 0.2,
      assignment: "N-H bending (Amide II)"
    });
  }

  // Add some CH stretches for all organic molecules
  peaks.push({
    wavenumber: 2950 + Math.random() * 80,
    intensity: 0.5 + Math.random() * 0.3,
    assignment: "C-H stretch"
  });
  
  // Add some fingerprint region peaks
  for (let i = 0; i < 3 + Math.floor(Math.random() * 5); i++) {
    peaks.push({
      wavenumber: 600 + Math.random() * 800,
      intensity: 0.3 + Math.random() * 0.5,
      assignment: "Fingerprint region"
    });
  }

  // Sort by wavenumber
  return peaks.sort((a, b) => a.wavenumber - b.wavenumber);
};

// Simulate UV-Vis spectrum based on SMILES
export const simulateUVSpectrum = (smiles: string): UVPeak[] => {
  const features = analyzeMolecule(smiles);
  const peaks: UVPeak[] = [];
  
  // Create a baseline spectrum
  const baselinePoints = 100;
  const baselineData: UVPeak[] = [];
  
  for (let i = 0; i < baselinePoints; i++) {
    const wavelength = 200 + (i * 600) / baselinePoints;
    baselineData.push({
      wavelength,
      absorbance: 0.05 + Math.random() * 0.05,
      transition: ""
    });
  }

  // Add characteristic peaks based on functional groups
  if (features.hasAromatic) {
    // Aromatic π→π* transition
    const maxWavelength = 260 + Math.random() * 20;
    
    for (let i = 0; i < baselinePoints; i++) {
      const wavelength = 200 + (i * 600) / baselinePoints;
      const distance = Math.abs(wavelength - maxWavelength);
      const peakWidth = 20 + Math.random() * 10;
      
      // Gaussian peak shape
      const gaussianPeak = 0.8 * Math.exp(-Math.pow(distance / peakWidth, 2));
      
      if (baselineData[i]) {
        baselineData[i].absorbance += gaussianPeak;
        if (Math.abs(wavelength - maxWavelength) < 5) {
          baselineData[i].transition = "π→π* (aromatic)";
        }
      }
    }
  }

  if (features.hasCarbonyl) {
    // Carbonyl n→π* transition
    const maxWavelength = 280 + Math.random() * 30;
    
    for (let i = 0; i < baselinePoints; i++) {
      const wavelength = 200 + (i * 600) / baselinePoints;
      const distance = Math.abs(wavelength - maxWavelength);
      const peakWidth = 25 + Math.random() * 10;
      
      // Gaussian peak shape
      const gaussianPeak = 0.4 * Math.exp(-Math.pow(distance / peakWidth, 2));
      
      if (baselineData[i]) {
        baselineData[i].absorbance += gaussianPeak;
        if (Math.abs(wavelength - maxWavelength) < 5) {
          baselineData[i].transition = "n→π* (carbonyl)";
        }
      }
    }
  }

  if (features.hasAlkene) {
    // Simple alkene π→π* transition
    const maxWavelength = 190 + Math.random() * 20;
    
    for (let i = 0; i < baselinePoints; i++) {
      const wavelength = 200 + (i * 600) / baselinePoints;
      const distance = Math.abs(wavelength - maxWavelength);
      const peakWidth = 15 + Math.random() * 10;
      
      // Gaussian peak shape
      const gaussianPeak = 0.6 * Math.exp(-Math.pow(distance / peakWidth, 2));
      
      if (baselineData[i] && wavelength >= 200) {
        baselineData[i].absorbance += gaussianPeak;
        if (Math.abs(wavelength - maxWavelength) < 5 && wavelength >= 200) {
          baselineData[i].transition = "π→π* (alkene)";
        }
      }
    }
  }

  // Extract key peaks
  let prevAbsorbance = 0;
  let rising = false;
  
  for (let i = 0; i < baselineData.length; i++) {
    const point = baselineData[i];
    
    // Detect peaks as points where the curve changes from rising to falling
    if (i > 0) {
      const isRisingNow = point.absorbance > prevAbsorbance;
      
      if (rising && !isRisingNow) {
        // Found a peak maximum
        peaks.push({
          wavelength: point.wavelength,
          absorbance: point.absorbance,
          transition: point.transition || "Electronic transition"
        });
      }
      
      rising = isRisingNow;
    }
    
    prevAbsorbance = point.absorbance;
  }

  // If no significant peaks were detected, add at least one
  if (peaks.length === 0) {
    const maxAbsPoint = baselineData.reduce((max, point) => 
      point.absorbance > max.absorbance ? point : max, baselineData[0]);
    
    peaks.push({
      wavelength: maxAbsPoint.wavelength,
      absorbance: maxAbsPoint.absorbance,
      transition: "Electronic transition"
    });
  }

  // Return both baseline data for curve and peaks for markers
  return [...baselineData, ...peaks];
};

// Simulate NMR spectrum based on SMILES and NMR type
export const simulateNMRSpectrum = (smiles: string, type: "1H" | "13C"): NMRPeak[] => {
  const features = analyzeMolecule(smiles);
  const peaks: NMRPeak[] = [];

  if (type === "1H") {
    // Proton NMR peaks
    
    // TMS reference (not actually shown, but used as reference)
    // peaks.push({
    //   shift: 0,
    //   intensity: 0.2,
    //   multiplicity: "s",
    //   coupling: 0,
    //   assignment: "TMS (reference)",
    //   atomIds: []
    // });
    
    // Aromatic protons (6.5-8.5 ppm)
    if (features.hasAromatic) {
      const aromaticProtonCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < aromaticProtonCount; i++) {
        peaks.push({
          shift: 6.5 + Math.random() * 2,
          intensity: 0.2 + Math.random() * 0.8,
          multiplicity: ["s", "d", "t", "dd"][Math.floor(Math.random() * 4)],
          coupling: 6 + Math.random() * 4,
          assignment: "Aromatic H",
          atomIds: [i]
        });
      }
    }
    
    // Alkene protons (4.5-6.5 ppm)
    if (features.hasAlkene) {
      const alkeneProtonCount = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < alkeneProtonCount; i++) {
        peaks.push({
          shift: 4.5 + Math.random() * 2,
          intensity: 0.2 + Math.random() * 0.8,
          multiplicity: ["d", "dd", "dt", "t"][Math.floor(Math.random() * 4)],
          coupling: 7 + Math.random() * 10,
          assignment: "Alkene H",
          atomIds: [i + 10]
        });
      }
    }
    
    // OH protons (1.5-5.5 ppm, broad singlet)
    if (features.hasOH) {
      peaks.push({
        shift: 2.5 + Math.random() * 3,
        intensity: 0.2 + Math.random() * 0.6,
        multiplicity: "bs",
        coupling: 0,
        assignment: "OH",
        atomIds: [20]
      });
    }
    
    // NH protons (5-8 ppm, broad singlet)
    if (features.hasNH) {
      peaks.push({
        shift: 5 + Math.random() * 3,
        intensity: 0.2 + Math.random() * 0.6,
        multiplicity: "bs",
        coupling: 0,
        assignment: "NH",
        atomIds: [21]
      });
    }
    
    // Aliphatic protons near electronegative atoms (3-4.5 ppm)
    if (features.hasOH || features.hasNH || features.hasEster) {
      peaks.push({
        shift: 3 + Math.random() * 1.5,
        intensity: 0.4 + Math.random() * 0.6,
        multiplicity: ["t", "q", "m"][Math.floor(Math.random() * 3)],
        coupling: 6 + Math.random() * 3,
        assignment: "H adjacent to O/N",
        atomIds: [30]
      });
    }
    
    // Methylene protons (1.2-2.2 ppm)
    const methyleneCount = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < methyleneCount; i++) {
      peaks.push({
        shift: 1.2 + Math.random() * 1,
        intensity: 0.5 + Math.random() * 0.5,
        multiplicity: ["m", "q", "t"][Math.floor(Math.random() * 3)],
        coupling: 6 + Math.random() * 2,
        assignment: "CH2",
        atomIds: [40 + i]
      });
    }
    
    // Methyl protons (0.7-1.2 ppm)
    const methylCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < methylCount; i++) {
      peaks.push({
        shift: 0.7 + Math.random() * 0.5,
        intensity: 0.7 + Math.random() * 0.3,
        multiplicity: ["s", "d", "t"][Math.floor(Math.random() * 3)],
        coupling: 6 + Math.random() * 1,
        assignment: "CH3",
        atomIds: [50 + i]
      });
    }
  } else {
    // Carbon-13 NMR peaks
    
    // Carbonyl carbons (160-210 ppm)
    if (features.hasCarbonyl) {
      peaks.push({
        shift: 160 + Math.random() * 50,
        intensity: 0.3 + Math.random() * 0.7,
        multiplicity: "s",
        coupling: 0,
        assignment: "C=O",
        atomIds: [1]
      });
    }
    
    // Aromatic carbons (110-150 ppm)
    if (features.hasAromatic) {
      const aromaticCarbonCount = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < aromaticCarbonCount; i++) {
        peaks.push({
          shift: 110 + Math.random() * 40,
          intensity: 0.2 + Math.random() * 0.8,
          multiplicity: "s",
          coupling: 0,
          assignment: "Aromatic C",
          atomIds: [10 + i]
        });
      }
    }
    
    // Alkene carbons (100-150 ppm)
    if (features.hasAlkene) {
      peaks.push({
        shift: 100 + Math.random() * 50,
        intensity: 0.3 + Math.random() * 0.7,
        multiplicity: "s",
        coupling: 0,
        assignment: "C=C",
        atomIds: [20]
      });
      
      peaks.push({
        shift: 100 + Math.random() * 50,
        intensity: 0.3 + Math.random() * 0.7,
        multiplicity: "s",
        coupling: 0,
        assignment: "C=C",
        atomIds: [21]
      });
    }
    
    // Carbons adjacent to O or N (50-80 ppm)
    if (features.hasOH || features.hasNH || features.hasEster) {
      peaks.push({
        shift: 50 + Math.random() * 30,
        intensity: 0.4 + Math.random() * 0.6,
        multiplicity: "s",
        coupling: 0,
        assignment: "C-O or C-N",
        atomIds: [30]
      });
    }
    
    // Aliphatic carbons (10-50 ppm)
    const aliphaticCount = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < aliphaticCount; i++) {
      peaks.push({
        shift: 10 + Math.random() * 40,
        intensity: 0.5 + Math.random() * 0.5,
        multiplicity: "s",
        coupling: 0,
        assignment: i % 3 === 0 ? "CH3" : i % 3 === 1 ? "CH2" : "CH",
        atomIds: [40 + i]
      });
    }
  }

  // Sort by chemical shift (descending for NMR)
  return peaks.sort((a, b) => b.shift - a.shift);
};
