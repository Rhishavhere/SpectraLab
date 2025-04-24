import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card"; // Assuming shadcn/ui Card component
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for better loading states

// Define the structure for the molecule information
interface MoleculeInfo {
  commonName: string;
  molecularFormula: string;
  molecularWeight: number; // Expecting a number after parsing
  description: string;
  applications: string[];
}

// Define the props for the component
interface MoleculeDisplayProps {
  smiles: string; // The SMILES string passed as a prop
}

const MoleculeDisplay = ({ smiles }: MoleculeDisplayProps) => {
  // State variables
  const [imageUrl, setImageUrl] = useState<string>(""); // URL for the molecule structure image
  const [moleculeInfo, setMoleculeInfo] = useState<MoleculeInfo | null>(null); // Parsed info from API
  const [loadingInfo, setLoadingInfo] = useState(false); // Loading state for API call (info)
  const [errorInfo, setErrorInfo] = useState<string | null>(null); // Error message state for info API
  const [loadingImage, setLoadingImage] = useState(true); // State for image loading itself
  const [errorImage, setErrorImage] = useState(false); // State for image loading error

  // Function to fetch molecule information from Gemini API
  const fetchMoleculeInfo = async (smilesInput: string) => {
    // Reset previous info/error states for the info part
    setLoadingInfo(true);
    setErrorInfo(null);
    setMoleculeInfo(null);

    try {
      // Initialize Gemini AI client
      const apiKey = import.meta.env.GENAI;
      if (!apiKey) {
        throw new Error("Gemini API key (VITE_GEMINI_API_KEY) is missing.");
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Or your preferred model

      // Construct the prompt requesting JSON output
      const prompt = `Given the SMILES notation "${smilesInput}", provide detailed information about the molecule strictly in the following JSON format:
{
  "commonName": "common or IUPAC name",
  "molecularFormula": "chemical formula",
  "molecularWeight": "weight in g/mol as a NUMBER (e.g., 180.16, not '180.16 g/mol')",
  "description": "brief description of the molecule",
  "applications": ["list", "of", "common", "applications"]
}
Provide ONLY the raw JSON object as the response, without any introductory text, explanations, backticks, or markdown formatting like \`\`\`json ... \`\`\`.`;


      // --- Using Manual Parsing (Fallback) ---
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      // console.log("Raw API Response Text:", text);

      // Clean potential markdown fences and extra text
      text = text.trim();
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        text = jsonMatch[1].trim();
      } else {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          text = text.substring(jsonStart, jsonEnd + 1);
        } else {
             console.error("Could not extract valid JSON object from response:", text);
             throw new Error("API response did not contain a valid JSON object.");
        }
      }
      // console.log("Cleaned Text for Parsing:", text);

      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (parseError) {
        console.error("JSON Parsing Error:", parseError);
        console.error("Text attempted to parse:", text);
        throw new Error("Failed to parse JSON response from API.");
      }
      // --- End of Manual Parsing ---


      if (!parsedData || typeof parsedData !== 'object') {
          throw new Error("Parsed data is not a valid object.");
      }

      const weightString = String(parsedData.molecularWeight || '0');
      const weightNumber = parseFloat(weightString.replace(/[^0-9.]/g, ''));

      const validatedInfo: MoleculeInfo = {
        commonName: String(parsedData.commonName || "N/A"),
        molecularFormula: String(parsedData.molecularFormula || "N/A"),
        molecularWeight: isNaN(weightNumber) ? 0 : weightNumber,
        description: String(parsedData.description || "No description available."),
        applications: Array.isArray(parsedData.applications) ? parsedData.applications.map(String) : [],
      };

      setMoleculeInfo(validatedInfo);

    } catch (err) {
      console.error("Error in fetchMoleculeInfo:", err);
      setErrorInfo(err instanceof Error ? err.message : "Failed to fetch molecule information. Check API key and network.");
    } finally {
      setLoadingInfo(false); // Stop loading indicator for info
    }
  };

  // useEffect hook to react to changes in the 'smiles' prop
  useEffect(() => {
    // Reset all states when smiles changes
    setImageUrl("");
    setMoleculeInfo(null);
    setErrorInfo(null);
    setErrorImage(false);
    setLoadingInfo(true); // Assume loading starts for info
    setLoadingImage(true); // Assume loading starts for image

    if (smiles) {
      // Basic check for SMILES-like characters
      if (!/^[a-zA-Z0-9@+\-\[\]\(\)\.\\=#$:,/]+$/.test(smiles)) {
          setErrorInfo("Invalid characters detected in SMILES string."); // Show error in info section
          setErrorImage(true); // Also indicate issue for image section
          setLoadingInfo(false); // Stop loading indicators
          setLoadingImage(false);
          return; // Stop processing
      }

      // Encode the SMILES string for URL safety
      const encodedSmiles = encodeURIComponent(smiles);
      // Set the image URL using PubChem's REST API
      setImageUrl(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodedSmiles}/PNG`);
      // Fetch the detailed molecule information
      fetchMoleculeInfo(smiles); // This will set loadingInfo to true internally
    } else {
      // If smiles is empty, ensure loading states are off
      setLoadingInfo(false);
      setLoadingImage(false);
    }
  }, [smiles]); // Re-run this effect only when the 'smiles' prop changes

  // --- Render Logic ---

  // Render placeholder if no SMILES string is provided
  if (!smiles) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Enter a molecule SMILES notation or select one from the library.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render the main card display with side-by-side layout
  return (
    <Card>
      <CardContent className="p-4">
        {/* Use Flexbox for side-by-side layout. Stack on small screens */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">

          {/* Column 1: Image */}
          <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center p-2 relative overflow-hidden">
              {/* Image Loading Skeleton/Placeholder */}
              {loadingImage && !errorImage && (
                <Skeleton className="absolute inset-0 w-full h-full" />
                 /* Or a simple text placeholder: */
                 /* <p className="text-muted-foreground text-sm text-center p-2">Loading Structure...</p> */
              )}

              {/* Image Error Message */}
              {errorImage && (
                 <div className="absolute inset-0 flex items-center justify-center p-2">
                    <p className="text-red-500 text-center text-sm">
                        {errorInfo?.includes("Invalid characters") ? errorInfo : "Failed to load structure."}
                    </p>
                 </div>
              )}

              {/* The Actual Image */}
              {imageUrl && !errorImage && (
                <img
                  src={imageUrl}
                  alt={`Structure of ${moleculeInfo?.commonName || smiles}`}
                   // Make image visible only when loaded, handle intrinsic size
                   className={`object-contain w-full h-full transition-opacity duration-300 ${loadingImage ? 'opacity-0' : 'opacity-100'}`}
                   style={{ maxWidth: '100%', maxHeight: '100%' }} // Ensure it fits container
                  onLoad={() => setLoadingImage(false)}
                  onError={() => {
                    console.error("Failed to load image from URL:", imageUrl);
                    setLoadingImage(false);
                    setErrorImage(true);
                  }}
                />
              )}
            </div>
          </div>

          {/* Column 2: Information */}
          <div className="w-full md:w-2/3 lg:w-3/4 flex-grow min-w-0"> {/* min-w-0 prevents flex item overflow */}
            {/* Info Loading Skeletons */}
            {loadingInfo && (
              <div className="space-y-4">
                <Skeleton className="h-6 w-3/5" /> {/* commonName */}
                <Skeleton className="h-4 w-2/5" /> {/* formula */}
                <Skeleton className="h-4 w-1/4" /> {/* mw */}
                <Skeleton className="h-4 w-1/3 mt-4" /> {/* Description title */}
                <Skeleton className="h-12 w-full" /> {/* Description body */}
                <Skeleton className="h-4 w-1/3 mt-4" /> {/* Applications title */}
                <Skeleton className="h-4 w-4/5" /> {/* Application item */}
                <Skeleton className="h-4 w-3/4" /> {/* Application item */}
              </div>
            )}

            {/* Info Error Message */}
            {errorInfo && !loadingInfo && ( // Show only if not loading
              <div className="text-center md:text-left text-red-500 py-4">
                <p>Error fetching details: {errorInfo}</p>
              </div>
            )}

            {/* Display molecule info if available and not loading/error */}
            {moleculeInfo && !loadingInfo && !errorInfo && (
              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold break-words">{moleculeInfo.commonName}</h2>
                  <p className="text-sm text-muted-foreground">Formula: {moleculeInfo.molecularFormula}</p>
                  <p className="text-sm text-muted-foreground">
                    MW: {moleculeInfo.molecularWeight > 0 ? `${moleculeInfo.molecularWeight.toFixed(2)} g/mol` : 'N/A'}
                  </p>
                </div>

                {/* Description */}
                {moleculeInfo.description && moleculeInfo.description !== "No description available." && (
                  <div>
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-sm">{moleculeInfo.description}</p>
                  </div>
                )}

                {/* Applications */}
                {moleculeInfo.applications && moleculeInfo.applications.length > 0 && (
                  <div>
                    <h3 className="font-semibold">Applications</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {moleculeInfo.applications.map((app, index) => (
                        <li key={index}>{app}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Handle case where loading finished, no error, but no info */}
            {!loadingInfo && !errorInfo && !moleculeInfo && smiles && !errorInfo?.includes("Invalid characters") && (
                <div className="text-center md:text-left py-4">
                    <p className="text-muted-foreground">No molecule information found for this SMILES.</p>
                </div>
            )}
          </div> {/* End Column 2 */}

        </div> {/* End Flex Container */}
      </CardContent>
    </Card>
  );
};

export default MoleculeDisplay;