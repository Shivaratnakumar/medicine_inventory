import React, { useState } from 'react';
import PrescriptionScanner from './PrescriptionScanner';
import { Camera, FileText } from 'lucide-react';

const PrescriptionScannerTest = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState(null);

  const handleMedicinesDetected = (data) => {
    console.log('Medicines detected:', data);
    setScannedData(data);
    setShowScanner(false);
  };

  const handleClose = () => {
    setShowScanner(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Prescription Scanner Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the prescription scanning functionality with OCR and form generation
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <Camera className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Prescription Scanner
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Upload a prescription image to extract patient information, medicine names, and quantities.
            </p>
            <button
              onClick={() => setShowScanner(true)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Open Prescription Scanner
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-xl font-semibold text-gray-900">
                Features
              </h2>
            </div>
            <ul className="text-gray-600 space-y-2">
              <li>• OCR text extraction from prescription images</li>
              <li>• Automatic patient name detection</li>
              <li>• Medicine name and quantity extraction</li>
              <li>• Interactive prescription form</li>
              <li>• Medicine inventory matching</li>
              <li>• Order creation and cart integration</li>
            </ul>
          </div>
        </div>

        {scannedData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Scanned Data
            </h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
              {JSON.stringify(scannedData, null, 2)}
            </pre>
          </div>
        )}

        {showScanner && (
          <PrescriptionScanner
            onMedicinesDetected={handleMedicinesDetected}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
};

export default PrescriptionScannerTest;
