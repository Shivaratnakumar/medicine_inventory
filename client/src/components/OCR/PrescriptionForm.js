import React, { useState, useEffect } from 'react';
import { 
  User, 
  Pill, 
  Save, 
  Edit3, 
  CheckCircle, 
  Plus,
  Minus,
  X,
  CreditCard,
  Smartphone,
  Banknote,
  ShoppingBag
} from 'lucide-react';
import { medicineNamesAPI, ordersAPI, paymentAPI, billingAPI } from '../../services/api';
import PrescriptionPaymentModal from './PrescriptionPaymentModal';
import toast from 'react-hot-toast';

const PrescriptionForm = ({ 
  extractedData, 
  onSave, 
  onClose, 
  onAddToCart 
}) => {
  const [formData, setFormData] = useState({
    patientName: '',
    medicines: [],
    doctorName: '',
    prescriptionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [medicineSearch, setMedicineSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Prescription payment state
  const [prescriptionItems, setPrescriptionItems] = useState([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Initialize form data when extractedData changes
  useEffect(() => {
    if (extractedData) {
      // Convert extracted medicines to the format expected by the form
      const extractedMedicines = (extractedData.medicines || []).map(med => ({
        id: `extracted_${Date.now()}_${Math.random()}`, // Generate temporary ID
        name: med.name,
        strength: med.strength || '',
        quantity: med.quantity || 1,
        unit: med.unit || 'tablet',
        price: 0, // Will be filled when matched with inventory
        stock: 0, // Will be filled when matched with inventory
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        duration: med.duration || '',
        isExtracted: true // Flag to identify extracted medicines
      }));

      setFormData(prev => ({
        ...prev,
        patientName: extractedData.patientName || '',
        doctorName: extractedData.doctorName || '',
        medicines: extractedMedicines
      }));

      // Try to match extracted medicines with inventory
      matchExtractedMedicinesWithInventory(extractedMedicines);
    }
  }, [extractedData]);

  // Match extracted medicines with inventory
  const matchExtractedMedicinesWithInventory = async (extractedMedicines) => {
    for (let i = 0; i < extractedMedicines.length; i++) {
      const medicine = extractedMedicines[i];
      try {
        // Clean the medicine name for better matching
        const cleanName = medicine.name.toLowerCase().trim();
        
        // Try different search variations
        const searchTerms = [
          cleanName,
          cleanName.replace(/\s+/g, ''), // Remove spaces
          cleanName.split(' ')[0], // First word only
          cleanName.replace(/\d+/g, '').trim() // Remove numbers
        ];

        let bestMatch = null;
        let searchResult = null;

        // Try each search term
        for (const term of searchTerms) {
          if (term.length < 2) continue;
          
          const result = await medicineNamesAPI.search(term, {
            type: 'all',
            min_score: 0.2,
            limit: 10
          });

          if (result.success && result.data && result.data.length > 0) {
            searchResult = result.data;
            break;
          }
        }

        if (searchResult && searchResult.length > 0) {
          // Find the best match based on name similarity and strength
          bestMatch = searchResult.find(med => {
            const medName = med.name.toLowerCase();
            const medStrength = (med.strength || '').toLowerCase();
            const extractedStrength = (medicine.strength || '').toLowerCase();
            
            return (
              medName.includes(cleanName) ||
              cleanName.includes(medName) ||
              medName.includes(cleanName.split(' ')[0]) ||
              (medStrength && extractedStrength && medStrength.includes(extractedStrength))
            );
          }) || searchResult[0];

          if (bestMatch) {
            // Update the medicine with inventory data
            setFormData(prev => ({
              ...prev,
              medicines: prev.medicines.map((med, index) => 
                index === i ? {
                  ...med,
                  id: bestMatch.id,
                  name: bestMatch.name,
                  strength: bestMatch.strength || medicine.strength,
                  price: bestMatch.price || 0,
                  stock: bestMatch.quantity_in_stock || 0,
                  unit: bestMatch.unit || medicine.unit
                } : med
              )
            }));
            
            console.log(`Matched ${medicine.name} with ${bestMatch.name} (Stock: ${bestMatch.quantity_in_stock}, Price: ${bestMatch.price})`);
          }
        }
      } catch (error) {
        console.error(`Error matching medicine ${medicine.name}:`, error);
      }
    }
  };

  // Search for medicines
  const searchMedicines = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await medicineNamesAPI.search(query, {
        type: 'all',
        min_score: 0.3,
        limit: 10
      });

      if (result.success) {
        setSearchResults(result.data || []);
      }
    } catch (error) {
      console.error('Medicine search error:', error);
      toast.error('Error searching medicines');
    } finally {
      setIsSearching(false);
    }
  };

  // Handle medicine search input
  const handleMedicineSearch = (e) => {
    const query = e.target.value;
    setMedicineSearch(query);
    searchMedicines(query);
  };

  // Add medicine to prescription
  const addMedicine = (medicine) => {
    const existingMedicine = formData.medicines.find(
      med => med.id === medicine.id
    );

    if (existingMedicine) {
      toast.error('Medicine already added to prescription');
      return;
    }

    const newMedicine = {
      id: medicine.id,
      name: medicine.name,
      strength: medicine.strength || '',
      quantity: 1,
      unit: medicine.unit || 'tablet',
      price: medicine.price || 0,
      stock: medicine.quantity_in_stock || 0,
      dosage: '',
      frequency: '',
      duration: ''
    };

    setFormData(prev => ({
      ...prev,
      medicines: [...prev.medicines, newMedicine]
    }));

    setMedicineSearch('');
    setSearchResults([]);
    toast.success('Medicine added to prescription');
  };

  // Update medicine quantity
  const updateMedicineQuantity = (index, quantity) => {
    if (quantity < 1) return;

    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, quantity: parseInt(quantity) } : med
      )
    }));
  };

  // Update medicine details
  const updateMedicineDetails = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  // Remove medicine from prescription
  const removeMedicine = (index) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required';
    }

    if (formData.medicines.length === 0) {
      newErrors.medicines = 'At least one medicine is required';
    }

    formData.medicines.forEach((medicine, index) => {
      if (!medicine.quantity || medicine.quantity < 1) {
        newErrors[`medicine_${index}_quantity`] = 'Quantity must be at least 1';
      }
      // Only validate stock if we have a proper database ID and stock information
      if (medicine.id && !medicine.id.startsWith('extracted_') && medicine.stock > 0 && medicine.quantity > medicine.stock) {
        newErrors[`medicine_${index}_stock`] = 'Quantity exceeds available stock';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save prescription
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);
    try {
      // Create order data
      const orderData = {
        patient_name: formData.patientName,
        doctor_name: formData.doctorName,
        prescription_date: formData.prescriptionDate,
        notes: formData.notes,
        medicines: formData.medicines.map(med => ({
          medicine_id: med.id,
          quantity: med.quantity,
          unit: med.unit,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration
        })),
        status: 'pending',
        total_amount: formData.medicines.reduce((total, med) => 
          total + (med.price * med.quantity), 0
        )
      };

      const result = await ordersAPI.create(orderData);
      
      if (result.success) {
        toast.success('Prescription saved successfully');
        if (onSave) {
          onSave(result.data);
        }
        if (onClose) {
          onClose();
        }
      } else {
        toast.error(result.message || 'Failed to save prescription');
      }
    } catch (error) {
      console.error('Save prescription error:', error);
      toast.error('Error saving prescription');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle order with payment
  const handleOrder = () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before placing order');
      return;
    }

    // Convert form medicines to prescription items for payment
    const items = formData.medicines.map(med => ({
      id: med.id,
      name: med.name,
      sku: med.sku || '',
      price: med.price,
      quantity: med.quantity,
      strength: med.strength,
      unit: med.unit
    }));
    
    setPrescriptionItems(items);
    setIsPaymentModalOpen(true);
  };

  // Prescription payment management functions
  const updatePrescriptionQuantity = (medicineId, newQuantity) => {
    setPrescriptionItems(prev => 
      prev.map(item => 
        item.id === medicineId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removePrescriptionItem = (medicineId) => {
    setPrescriptionItems(prev => prev.filter(item => item.id !== medicineId));
  };

  const clearPrescription = () => {
    setPrescriptionItems([]);
    setIsPaymentModalOpen(false);
  };

  const getPrescriptionTotal = () => {
    return prescriptionItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getPrescriptionItemCount = () => {
    return prescriptionItems.length;
  };


  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
          <Edit3 className="h-6 w-6 mr-2 text-blue-600" />
          Prescription Form
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-1" />
              Patient Name *
            </label>
            <input
              type="text"
              value={formData.patientName}
              onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.patientName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter patient name"
            />
            {errors.patientName && (
              <p className="text-red-500 text-xs mt-1">{errors.patientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor Name
            </label>
            <input
              type="text"
              value={formData.doctorName}
              onChange={(e) => setFormData(prev => ({ ...prev, doctorName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter doctor name"
            />
          </div>
        </div>

        {/* Prescription Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prescription Date
          </label>
          <input
            type="date"
            value={formData.prescriptionDate}
            onChange={(e) => setFormData(prev => ({ ...prev, prescriptionDate: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Medicine Search and Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Pill className="h-4 w-4 inline mr-1" />
            Add Medicines *
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={medicineSearch}
              onChange={handleMedicineSearch}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search for medicines..."
            />
            
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((medicine) => (
                  <div
                    key={medicine.id}
                    onClick={() => addMedicine(medicine)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">{medicine.name}</div>
                    <div className="text-sm text-gray-600">
                      {medicine.strength && `${medicine.strength} • `}
                      Stock: {medicine.quantity_in_stock} • 
                      Price: ₹{medicine.price}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.medicines && (
            <p className="text-red-500 text-xs mt-1">{errors.medicines}</p>
          )}
        </div>

        {/* Selected Medicines */}
        {formData.medicines.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Selected Medicines</h4>
            {formData.medicines.map((medicine, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{medicine.name}</h5>
                    <p className="text-sm text-gray-600">
                      {medicine.strength && `${medicine.strength} • `}
                      Stock: {medicine.stock} • Price: ₹{medicine.price}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMedicine(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <div className="flex items-center border border-gray-300 rounded-md">
                      <button
                        onClick={() => updateMedicineQuantity(index, medicine.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={medicine.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        value={medicine.quantity}
                        onChange={(e) => updateMedicineQuantity(index, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-center border-0 focus:outline-none"
                        min="1"
                        max={medicine.stock}
                      />
                      <button
                        onClick={() => updateMedicineQuantity(index, medicine.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={medicine.quantity >= medicine.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    {errors[`medicine_${index}_quantity`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`medicine_${index}_quantity`]}
                      </p>
                    )}
                    {errors[`medicine_${index}_stock`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`medicine_${index}_stock`]}
                      </p>
                    )}
                  </div>

                  {/* Dosage */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicineDetails(index, 'dosage', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., 1 tablet"
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <input
                      type="text"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicineDetails(index, 'frequency', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., twice daily"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={medicine.duration}
                      onChange={(e) => updateMedicineDetails(index, 'duration', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., 5 days"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Any additional notes or instructions..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleOrder}
            disabled={formData.medicines.length === 0}
            className="px-4 py-2 text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Order
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || formData.medicines.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Prescription
              </>
            )}
          </button>
        </div>
      </div>

      {/* Prescription Payment Modal */}
      <PrescriptionPaymentModal
        prescriptionItems={prescriptionItems}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onUpdateQuantity={updatePrescriptionQuantity}
        onRemoveItem={removePrescriptionItem}
        onClearPrescription={clearPrescription}
        getPrescriptionTotal={getPrescriptionTotal}
        getPrescriptionItemCount={getPrescriptionItemCount}
      />
    </div>
  );
};

export default PrescriptionForm;
