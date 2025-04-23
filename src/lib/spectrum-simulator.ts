// src/lib/spectrum-simulator.ts

// --- Shared Interfaces & Types ---

/** Represents a point on a spectral curve */
type SpectrumPoint = [number, number]; // Typically [x-axis value, y-axis value]

/** Represents a key peak identified in a spectrum */
interface BasePeak {
  assignment: string; // Functional group or region assignment
}

// --- IR Specific Interfaces ---

/** Internal helper type for defining IR peak characteristics */
interface IRPeakInfo {
  wavenumber: number;
  targetTransmittance: number; // Desired minimum transmittance %
  width: number;             // Peak width (FWHM) in cm-1
  assignment: string;
}

/** Identified IR peak data for labeling */
interface IRSpectrumPeak extends BasePeak {
  wavenumber: number;      // cm-1
  transmittance: number;   // %
}

/** Output data structure for IR simulation */
interface IRSpectrumData {
  spectrum: SpectrumPoint[]; // Full spectrum curve: [wavenumber, transmittance][]
  peaks: IRSpectrumPeak[];   // Key peaks for labeling
}

// --- UV-Vis Specific Interfaces ---

/** Represents a point on the UV-Vis spectrum curve */
interface UVPoint {
    wavelength: number;      // nm
    absorbance: number;      // Absorbance Units (AU)
}

/** Identified UV-Vis peak data (lambda max) */
interface UVPeak extends UVPoint, BasePeak {
    transition: string; // Type of electronic transition (e.g., π→π*, n→π*)
}

/** Output data structure for UV-Vis simulation */
interface UVSpectrumData {
  spectrum: UVPoint[]; // Full spectrum curve data
  peaks: UVPeak[];     // Key identified peaks (lambda max)
}


// --- NMR Specific Interfaces ---

/** Identified NMR peak data */
interface NMRPeak extends BasePeak {
  shift: number;           // Chemical shift in ppm
  intensity: number;       // Relative intensity (arbitrary units, height or integral)
  multiplicity: string;    // e.g., "s", "d", "t", "q", "m", "bs" (broad singlet)
  coupling?: number;       // Coupling constant (J) in Hz (optional)
  atomIds?: number[];      // Simulated atom indices (optional)
}

// Note: NMR simulation doesn't typically generate a full curve in this context, just peak list
// type NMRSpectrumData = NMRPeak[]; // Direct array if no curve needed

// --- Molecule Feature Analysis ---

interface MoleculeFeatures {
  hasOH: boolean;            // Alcohol/Phenol OH
  hasCOOH: boolean;          // Carboxylic Acid
  hasNH: boolean;            // Amine NH (Primary/Secondary)
  hasAmideNH: boolean;       // Amide NH
  hasCarbonyl: boolean;      // General C=O (Ketone/Aldehyde/Acid/Ester/Amide)
  hasKetoneAldehyde: boolean;// Specific Ketone/Aldehyde C=O
  hasEster: boolean;         // Ester group C(=O)O
  hasAmide: boolean;         // Amide group C(=O)N
  hasEther: boolean;         // Ether C-O-C
  hasAlkene: boolean;        // C=C double bond
  hasAlkyne: boolean;        // C#C triple bond
  hasAromatic: boolean;      // Aromatic ring
  hasSp3CH: boolean;         // Presence of typical aliphatic C-H
  hasSp2CH: boolean;         // Presence of typical alkene/aromatic C-H
}

/**
 * Analyzes a SMILES string to detect basic chemical features.
 * Very simplified, not a replacement for proper cheminformatics tools.
 */
const analyzeMolecule = (smiles: string | null | undefined): MoleculeFeatures => {
  const features: MoleculeFeatures = {
    hasOH: false, hasCOOH: false, hasNH: false, hasAmideNH: false, hasCarbonyl: false,
    hasKetoneAldehyde: false, hasEster: false, hasAmide: false, hasEther: false,
    hasAlkene: false, hasAlkyne: false, hasAromatic: false, hasSp3CH: false, hasSp2CH: false,
  };

  if (!smiles) {
    return features;
  }

  // Basic checks using string includes and regex
  features.hasCarbonyl = smiles.includes("C=O") || smiles.includes("C(=O)");
  features.hasEster = smiles.includes("C(=O)O") || smiles.includes("OC=O"); // Note: Matches acid C=O- part too initially
  features.hasAmide = smiles.includes("C(=O)N") || smiles.includes("NC=O");
  features.hasCOOH = smiles.includes("C(=O)O") && (smiles.includes("(=O)OH") || smiles.includes("O=CO")); // Try to be more specific for COOH ending

  // Refine OH check: Look for O not part of C=O, COO, COC, O=CO
  features.hasOH = /O(?![(=]|\w?C(=O)|\w?O\w)/.test(smiles) || smiles.endsWith("OH"); // Basic check for terminal/non-ether/non-carbonyl O
  if (features.hasCOOH) features.hasOH = false; // Prioritize COOH over simple OH if detected

  // Refine NH check: Look for N not part of C=O, C#N, N=
  features.hasNH = /N(?![(]?=|[#C])/.test(smiles); // Basic check for N not double/triple/amide bonded
  if (features.hasAmide) {
      features.hasAmideNH = features.hasNH; // If Amide exists, any detected NH might be Amide NH
      features.hasNH = false; // Avoid double counting simple amine NH if amide is present
  }

  features.hasKetoneAldehyde = features.hasCarbonyl && !features.hasEster && !features.hasAmide && !features.hasCOOH;
  features.hasEther = /C(?!=\S)O(?!=\S)C/.test(smiles) || /cOc/.test(smiles); // Basic C-O-C check
  features.hasAlkene = smiles.includes("C=C");
  features.hasAlkyne = smiles.includes("C#C");
  features.hasAromatic = /[a-z]/.test(smiles) || /c1.*c1/.test(smiles) || smiles.includes('C1=CC=CC=C1'); // Lowercase or explicit rings

  features.hasSp3CH = /C(?![=a-z#])/.test(smiles) || smiles.includes("CH") || smiles.includes("C") ; // Very basic check for non-sp2/sp carbons
  features.hasSp2CH = features.hasAlkene || features.hasAromatic;

  return features;
};


// --- IR Simulation ---

/** Helper function for Lorentzian peak shape (used in IR) */
const lorentzianPeak = (x: number, x0: number, fwhm: number, amplitude: number): number => {
    const gamma = fwhm / 2;
    if (gamma <= 0) return 0;
    const denominator = (x - x0) ** 2 + gamma ** 2;
    if (denominator === 0) return amplitude > 0 ? amplitude : 0;
    return amplitude * (gamma ** 2 / denominator);
};

/** Simulates an IR spectrum */
export const simulateIRSpectrum = (smiles: string): IRSpectrumData => {
  const features = analyzeMolecule(smiles);
  let characteristicPeaks: IRPeakInfo[] = [];

  // --- Define Characteristic Peaks ---
  if (features.hasOH) {
    characteristicPeaks.push({ wavenumber: 3350 + Math.random() * 250, targetTransmittance: 30 + Math.random() * 40, width: 100 + Math.random() * 200, assignment: 'O-H stretch (Alcohol/Phenol)' });
  }
  if (features.hasCOOH) {
     characteristicPeaks.push({ wavenumber: 2800 + Math.random() * 400, targetTransmittance: 40 + Math.random()*40, width: 300 + Math.random()*300, assignment: 'O-H stretch (Carboxylic Acid)' });
     characteristicPeaks.push({ wavenumber: 1710 + Math.random() * 20, targetTransmittance: 10 + Math.random() * 20, width: 25 + Math.random() * 15, assignment: 'C=O stretch (Carboxylic Acid)' });
  }
  if (features.hasNH) {
    characteristicPeaks.push({ wavenumber: 3350 + Math.random() * 150, targetTransmittance: 45 + Math.random() * 35, width: 50 + Math.random() * 50, assignment: 'N-H stretch' });
    // Simple check for possible primary amine doublet
    if (!smiles.match(/N\(/)) { // If N doesn't seem substituted
         characteristicPeaks.push({ wavenumber: 3400 + Math.random() * 100, targetTransmittance: 50 + Math.random() * 30, width: 40 + Math.random() * 40, assignment: 'N-H stretch' });
    }
  }
   if (features.hasAmideNH) {
      characteristicPeaks.push({ wavenumber: 3200 + Math.random() * 200, targetTransmittance: 40 + Math.random() * 30, width: 60 + Math.random() * 60, assignment: 'N-H stretch (Amide)' });
  }
   if (features.hasSp3CH) {
      characteristicPeaks.push({ wavenumber: 2960 + Math.random() * 40, targetTransmittance: 40 + Math.random() * 30, width: 25 + Math.random() * 15, assignment: 'C-H stretch (sp3)' });
      characteristicPeaks.push({ wavenumber: 2870 + Math.random() * 40, targetTransmittance: 50 + Math.random() * 30, width: 30 + Math.random() * 15, assignment: 'C-H stretch (sp3)' });
      // CH bends
       characteristicPeaks.push({ wavenumber: 1450 + Math.random() * 30, targetTransmittance: 50 + Math.random() * 30, width: 20 + Math.random() * 10, assignment: 'C-H bend (sp3)' });
       characteristicPeaks.push({ wavenumber: 1375 + Math.random() * 15, targetTransmittance: 55 + Math.random() * 25, width: 15 + Math.random() * 10, assignment: 'C-H bend (sp3)' }); // Often CH3 symmetric
  }
  if (features.hasSp2CH) {
     characteristicPeaks.push({ wavenumber: 3050 + Math.random() * 70, targetTransmittance: 70 + Math.random() * 20, width: 15 + Math.random() * 10, assignment: 'C-H stretch (sp2)' });
  }
  if (features.hasAlkyne && !smiles.includes("C#N")) { // Terminal C#C-H
     characteristicPeaks.push({ wavenumber: 3300 + Math.random() * 30, targetTransmittance: 50 + Math.random()*20, width: 20 + Math.random()*10, assignment: 'C-H stretch (sp)' });
     characteristicPeaks.push({ wavenumber: 2120 + Math.random() * 40, targetTransmittance: 70 + Math.random()*20, width: 15 + Math.random()*10, assignment: 'C#C stretch' });
  } else if (features.hasAlkyne) { // Internal C#C
      characteristicPeaks.push({ wavenumber: 2200 + Math.random() * 60, targetTransmittance: 85 + Math.random()*10, width: 15 + Math.random()*10, assignment: 'C#C stretch (Internal)' });
  }
  if (features.hasEster && !features.hasCOOH) { // Avoid double C=O if acid already added
     characteristicPeaks.push({ wavenumber: 1740 + Math.random() * 20, targetTransmittance: 10 + Math.random() * 15, width: 20 + Math.random() * 10, assignment: 'C=O stretch (Ester)' });
     characteristicPeaks.push({ wavenumber: 1180 + Math.random() * 100, targetTransmittance: 20 + Math.random() * 30, width: 30 + Math.random() * 20, assignment: 'C-O stretch (Ester)' }); // Strong C-O
  }
  if (features.hasAmide) {
       characteristicPeaks.push({ wavenumber: 1660 + Math.random() * 30, targetTransmittance: 15 + Math.random() * 20, width: 30 + Math.random() * 15, assignment: 'C=O stretch (Amide I)' });
       if (features.hasAmideNH) { // Only add Amide II if N-H is present
            characteristicPeaks.push({ wavenumber: 1550 + Math.random()*50, targetTransmittance: 40 + Math.random()*30, width: 30+Math.random()*20, assignment: 'N-H bend (Amide II)' });
       }
  }
  if (features.hasKetoneAldehyde) {
       characteristicPeaks.push({ wavenumber: 1715 + Math.random() * 25, targetTransmittance: 10 + Math.random() * 15, width: 20 + Math.random() * 10, assignment: 'C=O stretch (Ketone/Aldehyde)' });
       // Add Aldehyde C-H if applicable (simple check)
       if (smiles.includes("C(=O)H") || smiles.includes("C=O)H")) {
           characteristicPeaks.push({ wavenumber: 2720 + Math.random()*20, targetTransmittance: 70 + Math.random()*15, width: 15 + Math.random()*5, assignment: 'C-H stretch (Aldehyde)' });
           characteristicPeaks.push({ wavenumber: 2820 + Math.random()*20, targetTransmittance: 75 + Math.random()*15, width: 15 + Math.random()*5, assignment: 'C-H stretch (Aldehyde)' });
       }
  }
  if (features.hasAlkene) {
       characteristicPeaks.push({ wavenumber: 1650 + Math.random() * 30, targetTransmittance: 65 + Math.random() * 25, width: 15 + Math.random() * 10, assignment: 'C=C stretch (Alkene)' });
       // Add out-of-plane bends
        characteristicPeaks.push({ wavenumber: 910 + Math.random() * 80, targetTransmittance: 40 + Math.random() * 30, width: 20 + Math.random() * 15, assignment: 'C-H oop bend (Alkene)' });
  }
  if (features.hasAromatic) {
       characteristicPeaks.push({ wavenumber: 1600 + Math.random() * 15, targetTransmittance: 60 + Math.random() * 25, width: 15 + Math.random() * 10, assignment: 'C=C stretch (Aromatic)' });
       characteristicPeaks.push({ wavenumber: 1475 + Math.random() * 50, targetTransmittance: 55 + Math.random() * 30, width: 20 + Math.random() * 15, assignment: 'C=C stretch (Aromatic)' });
       // Add out-of-plane bends (strong)
       characteristicPeaks.push({ wavenumber: 750 + Math.random() * 100, targetTransmittance: 30 + Math.random() * 30, width: 25 + Math.random() * 15, assignment: 'C-H oop bend (Aromatic)' });
  }
   if (features.hasEther || (features.hasOH && !features.hasCOOH) || (features.hasEster && !features.hasCOOH)) { // C-O single bond
       // Avoid adding another C-O if already added strong ester C-O
       if(!characteristicPeaks.some(p => p.assignment === 'C-O stretch (Ester)')){
            characteristicPeaks.push({ wavenumber: 1100 + Math.random() * 150, targetTransmittance: 35 + Math.random() * 40, width: 40 + Math.random() * 30, assignment: 'C-O stretch' });
       }
   }
   // Add Nitrile C#N if present
   if (smiles.includes("C#N")) {
        characteristicPeaks.push({ wavenumber: 2250 + Math.random()*20, targetTransmittance: 50 + Math.random()*30, width: 15 + Math.random()*10, assignment: 'C#N stretch' });
   }

  // --- Fingerprint Region ---
  const fingerprintCount = 3 + Math.floor(Math.random() * 5);
  for (let i = 0; i < fingerprintCount; i++) {
    const fpWavenumber = 600 + Math.random() * 750; // 600 - 1350 cm-1
    // Avoid placing directly on top of strong characteristic peaks
    const isTooClose = characteristicPeaks.some(p => Math.abs(p.wavenumber - fpWavenumber) < 40 && p.targetTransmittance < 50);
    if (!isTooClose) {
        characteristicPeaks.push({ wavenumber: fpWavenumber, targetTransmittance: 45 + Math.random() * 45, width: 15 + Math.random() * 15, assignment: 'Fingerprint region' });
    }
  }

   // --- Acetone Specific Override (Example) ---
   if (smiles === 'CC(=O)C') {
       let filteredPeaks = characteristicPeaks.filter(p => // Remove conflicting generics
           !(p.assignment.includes("C=O") && Math.abs(p.wavenumber - 1715) < 50) &&
           !(p.assignment.includes("C-H stretch (sp3)")) &&
           !(p.assignment.includes("C-H bend (sp3)")) &&
           !(p.assignment === "Fingerprint region" && Math.abs(p.wavenumber - 1220) < 50)
       );
       characteristicPeaks = filteredPeaks;
       // Add specific peaks
       characteristicPeaks.push({ wavenumber: 1715+(Math.random()-0.5)*5, targetTransmittance: 5+Math.random()*5, width: 18+Math.random()*5, assignment: 'C=O' });
       characteristicPeaks.push({ wavenumber: 2965+(Math.random()-0.5)*10, targetTransmittance: 50+Math.random()*10, width: 20+Math.random()*10, assignment: 'C-H'}); // asym
       characteristicPeaks.push({ wavenumber: 2925+(Math.random()-0.5)*10, targetTransmittance: 55+Math.random()*15, width: 20+Math.random()*10, assignment: 'C-H'}); // sym
        characteristicPeaks.push({ wavenumber: 1430+(Math.random()-0.5)*10, targetTransmittance: 40+Math.random()*10, width: 15+Math.random()*8, assignment: 'CH3 bend'}); // asym
       characteristicPeaks.push({ wavenumber: 1360+(Math.random()-0.5)*5, targetTransmittance: 45+Math.random()*10, width: 12+Math.random()*5, assignment: 'CH3 bend'}); // sym
       characteristicPeaks.push({ wavenumber: 1220+(Math.random()-0.5)*10, targetTransmittance: 40+Math.random()*15, width: 20+Math.random()*8, assignment: 'C-C stretch'});
   }

  // --- Generate Spectrum Curve ---
  const minWavenumber = 400;
  const maxWavenumber = 4000;
  const numPoints = (maxWavenumber - minWavenumber) * 2 + 1; // Point every 0.5 cm-1
  const step = (maxWavenumber - minWavenumber) / (numPoints - 1);
  const spectrum: SpectrumPoint[] = [];
  const peakMinima = new Map<string, { wavenumber: number; transmittance: number }>();
  const baselineLevel = 98;
  const noiseAmplitude = 0.8;
  const noiseFrequency = 0.08;

  for (let i = 0; i < numPoints; i++) {
    const wavenumber = minWavenumber + i * step;
    let noise = (Math.random() - 0.5) * 2 * noiseAmplitude;
    noise += Math.sin(wavenumber * noiseFrequency + Math.random()*Math.PI) * noiseAmplitude * 0.4; // Wavier noise
    let transmittance = baselineLevel + noise;
    let totalPeakContribution = 0;
    characteristicPeaks.forEach(peak => {
      const amplitude = Math.max(0, baselineLevel - peak.targetTransmittance);
      totalPeakContribution += lorentzianPeak(wavenumber, peak.wavenumber, peak.width, amplitude);
    });
    transmittance -= totalPeakContribution;
    transmittance = Math.max(0.1, Math.min(100, transmittance));
    spectrum.push([wavenumber, transmittance]);

    // Track minima near characteristic peak centers
     characteristicPeaks.forEach(peak => {
       const checkWindow = Math.max(5, peak.width / 3);
       if (Math.abs(wavenumber - peak.wavenumber) < checkWindow) {
          const key = `${peak.assignment}_${peak.wavenumber.toFixed(0)}`;
          const currentMin = peakMinima.get(key);
          if (!currentMin || transmittance < currentMin.transmittance) {
             peakMinima.set(key, { wavenumber: wavenumber, transmittance: transmittance });
          }
       }
     });
  }

  // --- Format Output Peaks ---
   const labeledPeaks: IRSpectrumPeak[] = [];
   peakMinima.forEach((value, key) => {
       const assignment = key.substring(0, key.lastIndexOf('_'));
       if (value.transmittance < baselineLevel - noiseAmplitude * 2.5) { // Threshold for significance
            const alreadyExists = labeledPeaks.some(lp => Math.abs(lp.wavenumber - value.wavenumber) < 15 && lp.assignment === assignment );
            if (!alreadyExists) {
                labeledPeaks.push({ wavenumber: value.wavenumber, transmittance: value.transmittance, assignment: assignment });
            }
       }
   });
   labeledPeaks.sort((a, b) => a.wavenumber - b.wavenumber);

   // --- Acetone Specific Label Simplification ---
   if (smiles === 'CC(=O)C') {
       const simpleLabels = labeledPeaks.map(p => {
            if (p.assignment.includes('C-C')) return {...p, assignment: 'C-C'};
            if (p.assignment.includes('CH3 bend')) return {...p, assignment: 'CH3'};
            if (p.assignment.includes('C=O')) return {...p, assignment: 'C=O'};
            if (p.assignment.includes('C-H')) return {...p, assignment: 'C-H'};
            return p; // Keep original if no match
       }).filter((p, index, self) => // Remove duplicates created by simplification
            index === self.findIndex(t => t.assignment === p.assignment)
       );
        return { spectrum, peaks: simpleLabels.sort((a, b) => a.wavenumber - b.wavenumber) };
   }

  return { spectrum, peaks: labeledPeaks };
};


// --- UV-Vis Simulation ---

/** Helper function for Gaussian peak shape (used in UV) */
const gaussianPeak = (x: number, x0: number, width: number, amplitude: number): number => {
    if (width <= 0) return 0;
    // width here can represent standard deviation or related parameter
    const exponent = -Math.pow(x - x0, 2) / (2 * Math.pow(width, 2));
    return amplitude * Math.exp(exponent);
};


/** Simulates a UV-Vis spectrum */
export const simulateUVSpectrum = (smiles: string): UVSpectrumData => {
    const features = analyzeMolecule(smiles);
    const identifiedPeaks: UVPeak[] = [];

    // Define potential transitions
    const transitions = [];
    if (features.hasAromatic) {
        transitions.push({ lambdaMax: 255 + Math.random() * 15, intensity: 0.6 + Math.random() * 0.4, width: 15 + Math.random()*10, type: "π→π* (aromatic, B band)" });
        transitions.push({ lambdaMax: 205 + Math.random() * 15, intensity: 0.8 + Math.random() * 0.5, width: 12 + Math.random()*8, type: "π→π* (aromatic, E band)" }); // Stronger, shorter wavelength
    }
    if (features.hasCarbonyl) { // n->pi* are generally weaker
        transitions.push({ lambdaMax: 270 + Math.random() * 30, intensity: 0.1 + Math.random() * 0.2, width: 20 + Math.random()*10, type: "n→π* (carbonyl)" });
    }
    if (features.hasEster) { // Ester pi->pi*
         transitions.push({ lambdaMax: 205 + Math.random() * 10, intensity: 0.3 + Math.random() * 0.2, width: 15 + Math.random()*5, type: "π→π* (ester)" });
    }
     if (features.hasAmide) { // Amide pi->pi*
         transitions.push({ lambdaMax: 210 + Math.random() * 15, intensity: 0.4 + Math.random() * 0.3, width: 18 + Math.random()*7, type: "π→π* (amide)" });
    }
    if (features.hasAlkene) { // Simple alkene pi->pi* (often < 200nm but tail might show)
        transitions.push({ lambdaMax: 195 + Math.random() * 15, intensity: 0.7 + Math.random() * 0.4, width: 10 + Math.random()*5, type: "π→π* (alkene)" });
    }
    // Add conjugated alkene logic if needed (shifts lambdaMax to higher values)

    // --- Generate Spectrum Curve ---
    const minWavelength = 200;
    const maxWavelength = 800; // Typical UV-Vis range
    const numPoints = (maxWavelength - minWavelength) * 2 + 1; // Point every 0.5 nm
    const step = (maxWavelength - minWavelength) / (numPoints - 1);
    const spectrum: UVPoint[] = [];
    const baselineAbsorbance = 0.03;
    const noiseAmplitude = 0.005;

     for (let i = 0; i < numPoints; i++) {
        const wavelength = minWavelength + i * step;
        let noise = (Math.random() - 0.5) * 2 * noiseAmplitude;
        let absorbance = baselineAbsorbance + noise;

        // Add contributions from all potential transitions
        transitions.forEach(trans => {
            absorbance += gaussianPeak(wavelength, trans.lambdaMax, trans.width, trans.intensity);
        });

        absorbance = Math.max(0, absorbance); // Absorbance cannot be negative
        spectrum.push({ wavelength, absorbance });
    }

    // --- Identify Peaks (Lambda Max) ---
    // Simple peak detection: find local maxima above threshold
    for (let i = 1; i < spectrum.length - 1; i++) {
        const prev = spectrum[i-1];
        const curr = spectrum[i];
        const next = spectrum[i+1];
        const threshold = baselineAbsorbance + noiseAmplitude * 3; // Must be above noise

        if (curr.absorbance > prev.absorbance && curr.absorbance > next.absorbance && curr.absorbance > threshold) {
             // Find the original transition assignment that is closest
             let closestTransition = "Electronic transition";
             let minDist = Infinity;
             transitions.forEach(trans => {
                 const dist = Math.abs(curr.wavelength - trans.lambdaMax);
                 if (dist < minDist && dist < trans.width * 2) { // Check if within reasonable range of a defined peak
                     minDist = dist;
                     closestTransition = trans.type;
                 }
             });

             // Avoid adding multiple points for the same broad peak
             const alreadyAdded = identifiedPeaks.some(p => Math.abs(p.wavelength - curr.wavelength) < 10);
             if (!alreadyAdded) {
                  identifiedPeaks.push({
                    wavelength: curr.wavelength,
                    absorbance: curr.absorbance,
                    assignment: closestTransition, // Use BasePeak assignment field
                    transition: closestTransition, // Keep specific transition field
                  });
             }
        }
    }
     identifiedPeaks.sort((a, b) => a.wavelength - b.wavelength);

    return { spectrum, peaks: identifiedPeaks };
};


// --- NMR Simulation ---

/** Simulates an NMR spectrum (returns peak list) */
export const simulateNMRSpectrum = (smiles: string, type: "1H" | "13C"): NMRPeak[] => {
  const features = analyzeMolecule(smiles);
  const peaks: NMRPeak[] = [];
  let atomIdCounter = 0; // Simple counter for simulated atom IDs

  if (type === "1H") {
    // --- Proton NMR ---
    if (features.hasAromatic) {
        peaks.push({ shift: 7.2 + Math.random() * 1.3, intensity: 0.5 + Math.random()*0.5, multiplicity: 'm', assignment: 'Aromatic H', atomIds: [++atomIdCounter] });
    }
    if (features.hasAlkene) {
        peaks.push({ shift: 5.5 + Math.random() * 1.0, intensity: 0.4 + Math.random()*0.4, multiplicity: 'm', assignment: 'Alkene H', atomIds: [++atomIdCounter] });
    }
     if (features.hasKetoneAldehyde && (smiles.includes("C(=O)H") || smiles.includes("C=O)H"))) { // Aldehyde H
          peaks.push({ shift: 9.5 + Math.random() * 0.5, intensity: 0.3 + Math.random()*0.3, multiplicity: 's', assignment: 'Aldehyde H', atomIds: [++atomIdCounter] });
     }
     if (features.hasCOOH) { // Acid H (very broad, variable shift)
         peaks.push({ shift: 10.0 + Math.random() * 2.0, intensity: 0.2 + Math.random()*0.2, multiplicity: 'bs', assignment: 'Acid OH', atomIds: [++atomIdCounter] });
     }
     if (features.hasOH) { // Alcohol/Phenol H (broad, variable)
         peaks.push({ shift: 3.0 + Math.random() * 2.5, intensity: 0.2 + Math.random()*0.3, multiplicity: 'bs', assignment: 'Alcohol/Phenol OH', atomIds: [++atomIdCounter] });
     }
     if (features.hasNH) { // Amine H (broad, variable)
          peaks.push({ shift: 2.0 + Math.random() * 3.0, intensity: 0.2 + Math.random()*0.3, multiplicity: 'bs', assignment: 'Amine NH', atomIds: [++atomIdCounter] });
     }
      if (features.hasAmideNH) { // Amide H (broad, downfield)
          peaks.push({ shift: 6.0 + Math.random() * 2.5, intensity: 0.2 + Math.random()*0.3, multiplicity: 'bs', assignment: 'Amide NH', atomIds: [++atomIdCounter] });
     }
     // H alpha to carbonyl/ester/amide/ether/OH
     if (features.hasCarbonyl || features.hasEther || features.hasOH) {
         peaks.push({ shift: 2.2 + Math.random() * 1.8, intensity: 0.6 + Math.random()*0.4, multiplicity: 'm', assignment: 'H alpha to heteroatom/C=O', atomIds: [++atomIdCounter] });
     }
     if (features.hasSp3CH) { // Generic Aliphatic CH/CH2/CH3
         peaks.push({ shift: 1.3 + Math.random() * 0.8, intensity: 0.8 + Math.random()*0.2, multiplicity: 'm', assignment: 'Aliphatic CHx', atomIds: [++atomIdCounter] });
         peaks.push({ shift: 0.9 + Math.random() * 0.4, intensity: 1.0 + Math.random()*0.3, multiplicity: 'm', assignment: 'Aliphatic CHx (upfield)', atomIds: [++atomIdCounter] }); // Often methyls
     }
      // Acetone Specific Example
      if (smiles === 'CC(=O)C') {
          peaks.length = 0; // Clear generic peaks
          peaks.push({ shift: 2.1 + (Math.random()-0.5)*0.1, intensity: 1.0, multiplicity: 's', assignment: 'CH3', atomIds: [1,2] }); // Single peak for both methyls
      }

  } else {
    // --- Carbon-13 NMR --- (All typically singlets in basic decoupled spectra)
     if (features.hasCarbonyl) {
        let shift = 170; let assignment = 'Carbonyl C';
        if (features.hasKetoneAldehyde) { shift = 195 + Math.random()*15; assignment = 'C=O (Ketone/Aldehyde)'; }
        else if (features.hasEster) { shift = 165 + Math.random()*15; assignment = 'C=O (Ester)'; }
        else if (features.hasAmide) { shift = 160 + Math.random()*15; assignment = 'C=O (Amide)'; }
        else if (features.hasCOOH) { shift = 170 + Math.random()*15; assignment = 'C=O (Acid)'; }
         peaks.push({ shift: shift, intensity: 0.3 + Math.random()*0.2, multiplicity: 's', assignment: assignment, atomIds: [++atomIdCounter] });
     }
     if (features.hasAromatic) {
         peaks.push({ shift: 128 + Math.random()*20, intensity: 0.6 + Math.random()*0.3, multiplicity: 's', assignment: 'Aromatic C', atomIds: [++atomIdCounter] });
          peaks.push({ shift: 115 + Math.random()*15, intensity: 0.5 + Math.random()*0.3, multiplicity: 's', assignment: 'Aromatic C', atomIds: [++atomIdCounter] }); // Often multiple peaks
     }
     if (features.hasAlkene) {
           peaks.push({ shift: 110 + Math.random()*30, intensity: 0.5 + Math.random()*0.3, multiplicity: 's', assignment: 'Alkene C=C', atomIds: [++atomIdCounter] });
     }
      if (features.hasAlkyne) {
           peaks.push({ shift: 70 + Math.random()*20, intensity: 0.4 + Math.random()*0.3, multiplicity: 's', assignment: 'Alkyne C#C', atomIds: [++atomIdCounter] });
     }
     // C bonded to O/N
      if (features.hasOH || features.hasEther || features.hasEster) { // C-O
           peaks.push({ shift: 55 + Math.random()*25, intensity: 0.7 + Math.random()*0.2, multiplicity: 's', assignment: 'C-O', atomIds: [++atomIdCounter] });
     }
      if (features.hasNH || features.hasAmide) { // C-N
           peaks.push({ shift: 40 + Math.random()*20, intensity: 0.6 + Math.random()*0.2, multiplicity: 's', assignment: 'C-N', atomIds: [++atomIdCounter] });
     }
     if (features.hasSp3CH) { // Aliphatic C
           peaks.push({ shift: 25 + Math.random()*20, intensity: 0.9 + Math.random()*0.1, multiplicity: 's', assignment: 'Aliphatic C', atomIds: [++atomIdCounter] });
           peaks.push({ shift: 15 + Math.random()*10, intensity: 1.0 + Math.random()*0.1, multiplicity: 's', assignment: 'Aliphatic C (upfield)', atomIds: [++atomIdCounter] });
     }
      // Acetone Specific Example
     if (smiles === 'CC(=O)C') {
          peaks.length = 0; // Clear generic peaks
          peaks.push({ shift: 206 + (Math.random()-0.5)*2, intensity: 0.4, multiplicity: 's', assignment: 'C=O', atomIds: [1] });
          peaks.push({ shift: 30 + (Math.random()-0.5)*1, intensity: 1.0, multiplicity: 's', assignment: 'CH3', atomIds: [2,3] });
      }
  }

  // Sort by chemical shift (descending for NMR convention)
  return peaks.sort((a, b) => b.shift - a.shift);
};