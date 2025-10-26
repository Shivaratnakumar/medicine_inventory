import React, { useState, useRef, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { 
  Upload, 
  Camera, 
  FileImage, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Search,
  Package,
  AlertTriangle,
  Check,
  XCircle,
  Edit3
} from 'lucide-react';
import { medicineNamesAPI } from '../../services/api';
import PrescriptionForm from './PrescriptionForm';
import toast from 'react-hot-toast';

const PrescriptionScanner = ({ onMedicinesDetected, onClose }) => {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedText, setExtractedText] = useState('');
  const [detectedMedicines, setDetectedMedicines] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Medicine name patterns to extract from OCR text
  const medicinePatterns = [
    // Common medicine name patterns
    /(?:^|\s)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:\d+\s*(?:mg|g|ml|tablet|tab|capsule|cap|syrup|drops|injection|inj))?/gi,
    // Generic names with dosage
    /(?:^|\s)([a-z]+(?:\s+[a-z]+)*)\s*(?:\d+\s*(?:mg|g|ml|tablet|tab|capsule|cap|syrup|drops|injection|inj))?/gi,
    // Brand names
    /(?:^|\s)([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)*)\s*(?:\d+\s*(?:mg|g|ml|tablet|tab|capsule|cap|syrup|drops|injection|inj))?/gi
  ];

  const handleImageUpload = useCallback((file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size should be less than 10MB');
      return;
    }

    setImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  // Parse prescription data from OCR text
  const parsePrescriptionData = (text) => {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let patientName = '';
    let doctorName = '';
    let medicines = [];
    
    // Extract patient name
    const patientPatterns = [
      /(?:patient|name|for)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:prescription\s+for|for)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:mr\.?|mrs\.?|ms\.?|dr\.?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];
    
    for (const pattern of patientPatterns) {
      const match = pattern.exec(cleanText);
      if (match && match[1]) {
        patientName = match[1].trim();
        break;
      }
    }
    
    // Extract doctor name
    const doctorPatterns = [
      /(?:doctor|dr\.?)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:physician|consultant)\s*:?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi
    ];
    
    for (const pattern of doctorPatterns) {
      const match = pattern.exec(cleanText);
      if (match && match[1]) {
        doctorName = match[1].trim();
        break;
      }
    }
    
    // Extract medicines with quantities
    const medicineLines = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      return lowerLine.includes('mg') || 
             lowerLine.includes('tablet') || 
             lowerLine.includes('capsule') || 
             lowerLine.includes('syrup') ||
             lowerLine.includes('drops') ||
             lowerLine.includes('injection') ||
             lowerLine.includes('ml') ||
             lowerLine.includes('g');
    });
    
    medicineLines.forEach(line => {
      // Extract medicine name and strength
      const medicineMatch = line.match(/([A-Za-z][A-Za-z0-9\s]+?)\s*(\d+\s*(?:mg|g|ml|tablet|tab|capsule|cap|syrup|drops|injection|inj))/i);
      if (medicineMatch) {
        const medicineName = medicineMatch[1].trim();
        const strength = medicineMatch[2].trim();
        
        // Extract quantity - look for patterns like "1 tablet", "2 capsules", etc.
        const quantityMatch = line.match(/(\d+)\s*(?:tablet|tab|capsule|cap|ml|bottle|strip|box)/i);
        const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
        
        // Extract dosage instructions - look for patterns like "1 tablet twice daily"
        const dosageMatch = line.match(/(\d+\s*(?:tablet|tab|capsule|cap|ml|drop|dose)s?)\s*(?:twice|once|thrice|daily|morning|evening|night|before|after|with|food)/i);
        const dosage = dosageMatch ? dosageMatch[0] : '';
        
        // Extract frequency from dosage
        const frequencyMatch = line.match(/(?:twice|once|thrice|daily|morning|evening|night)/i);
        const frequency = frequencyMatch ? frequencyMatch[0] : '';
        
        // Extract duration
        const durationMatch = line.match(/(?:for\s+)?(\d+\s*(?:days?|weeks?|months?))/i);
        const duration = durationMatch ? durationMatch[0] : '';
        
        medicines.push({
          name: medicineName,
          strength: strength,
          quantity: quantity,
          dosage: dosage,
          frequency: frequency,
          duration: duration,
          unit: strength.includes('mg') || strength.includes('g') ? 'tablet' : 
                strength.includes('ml') ? 'ml' : 'tablet',
          originalText: line
        });
      }
    });
    
    return {
      patientName,
      doctorName,
      medicines
    };
  };

  const extractMedicineNames = (text) => {
    const medicines = new Set();
    
    // Clean and normalize text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    // Extract medicine names using patterns
    medicinePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        const medicineName = match[1].trim();
        if (medicineName.length > 2 && medicineName.length < 50) {
          medicines.add(medicineName);
        }
      }
    });

    // Also try to extract from lines that might contain medicine names
    const lines = cleanText.split('\n');
    lines.forEach(line => {
      // Look for lines that might contain medicine names
      if (line.length > 5 && line.length < 100) {
        // Remove common prescription words
        const cleanedLine = line
          .replace(/\b(?:take|twice|daily|morning|evening|night|before|after|food|empty stomach|with water|as directed|prescribed|dosage|dose|quantity|qty|times|per day|once|twice|thrice)\b/gi, '')
          .replace(/\d+\s*(?:mg|g|ml|tablet|tab|capsule|cap|syrup|drops|injection|inj)\b/gi, '')
          .replace(/[^\w\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (cleanedLine.length > 2 && cleanedLine.length < 50) {
          medicines.add(cleanedLine);
        }
      }
    });

    return Array.from(medicines);
  };

  const matchMedicinesWithInventory = async (medicineNames) => {
    setIsMatching(true);
    const matchedMedicines = [];

    try {
      for (const medicineName of medicineNames) {
        try {
          // Search for medicine in inventory
          const searchResult = await medicineNamesAPI.search(medicineName, {
            type: 'all',
            min_score: 0.3,
            limit: 5
          });

          if (searchResult.success && searchResult.data.length > 0) {
            const bestMatch = searchResult.data[0];
            matchedMedicines.push({
              extractedName: medicineName,
              matchedMedicine: bestMatch.item,
              confidence: bestMatch.score,
              isAvailable: bestMatch.item.quantity_in_stock > 0,
              stock: bestMatch.item.quantity_in_stock,
              price: bestMatch.item.price
            });
          } else {
            // No match found
            matchedMedicines.push({
              extractedName: medicineName,
              matchedMedicine: null,
              confidence: 0,
              isAvailable: false,
              stock: 0,
              price: 0
            });
          }
        } catch (error) {
          console.error(`Error matching medicine ${medicineName}:`, error);
          matchedMedicines.push({
            extractedName: medicineName,
            matchedMedicine: null,
            confidence: 0,
            isAvailable: false,
            stock: 0,
            price: 0,
            error: true
          });
        }
      }
    } catch (error) {
      console.error('Error matching medicines:', error);
      toast.error('Error matching medicines with inventory');
    } finally {
      setIsMatching(false);
    }

    return matchedMedicines;
  };

  const processImage = async () => {
    if (!image) {
      toast.error('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setExtractedText('');
    setDetectedMedicines([]);
    setParsedData(null);

    try {
      // Initialize Tesseract worker
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });

      // Perform OCR
      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();

      setExtractedText(text);
      
      // Parse prescription data
      const parsed = parsePrescriptionData(text);
      setParsedData(parsed);
      
      // Extract medicine names from OCR text for inventory matching
      const medicineNames = extractMedicineNames(text);
      
      if (medicineNames.length === 0) {
        toast.error('No medicine names detected in the image. Please try a clearer image.');
        setIsProcessing(false);
        return;
      }

      // Match with inventory (but don't show the results)
      const matchedMedicines = await matchMedicinesWithInventory(medicineNames);
      setDetectedMedicines(matchedMedicines);

      toast.success(`Prescription scanned successfully! Opening form...`);
      
      // Directly show the prescription form after scanning
      setShowForm(true);
      
    } catch (error) {
      console.error('OCR processing error:', error);
      toast.error('Error processing image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddToOrder = () => {
    const availableMedicines = detectedMedicines.filter(med => med.isAvailable && med.matchedMedicine);
    
    if (availableMedicines.length === 0) {
      toast.error('No available medicines found to add to order');
      return;
    }

    if (onMedicinesDetected) {
      onMedicinesDetected(availableMedicines);
    }
    
    toast.success(`Added ${availableMedicines.length} medicines to order`);
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
  };

  const handleFormSave = (savedData) => {
    toast.success('Prescription saved successfully');
    setShowForm(false);
    if (onMedicinesDetected) {
      onMedicinesDetected(savedData);
    }
  };

  const handleFormAddToCart = (medicines) => {
    if (onMedicinesDetected) {
      onMedicinesDetected(medicines);
    }
    setShowForm(false);
  };

  const resetScanner = () => {
    setImage(null);
    setImagePreview(null);
    setExtractedText('');
    setDetectedMedicines([]);
    setProgress(0);
    setShowForm(false);
    setParsedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-2 mx-auto p-8 border w-11/12 md:w-5/6 lg:w-4/5 xl:w-3/4 shadow-lg rounded-md bg-white max-h-[98vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Camera className="h-7 w-7 mr-3 text-blue-600" />
            Prescription Scanner
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <div className="text-base font-medium text-gray-700">Upload Prescription Image</div>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <div className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <label className="cursor-pointer">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <FileImage className="h-10 w-10 text-gray-400 mb-3" />
                        <span className="text-base text-gray-600">Upload File</span>
                      </div>
                    </label>
                    
                    <label className="cursor-pointer">
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCameraCapture}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center p-6 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <Camera className="h-10 w-10 text-gray-400 mb-3" />
                        <span className="text-base text-gray-600">Take Photo</span>
                      </div>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF (Max 10MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Prescription preview"
                  className="w-full h-64 object-contain border border-gray-300 rounded-lg"
                />
                <button
                  onClick={resetScanner}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {image && (
              <button
                onClick={processImage}
                disabled={isProcessing}
                className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing... {progress}%
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan Prescription
                  </>
                )}
              </button>
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700">Detection Results</div>
            
            {extractedText && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Extracted Text:</div>
                <div className="text-xs text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {extractedText}
                </div>
              </div>
            )}

            {isMatching && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
                <span className="text-gray-600">Matching with inventory...</span>
              </div>
            )}

            {!isProcessing && !isMatching && !showForm && image && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Click "Scan Prescription" to process the image and create a prescription form.</p>
              </div>
            )}
          </div>
        </div>

        {/* Prescription Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60">
            <div className="relative top-4 mx-auto p-6 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[95vh] overflow-y-auto">
              <PrescriptionForm
                extractedData={parsedData}
                onSave={handleFormSave}
                onClose={handleFormClose}
                onAddToCart={handleFormAddToCart}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionScanner;

