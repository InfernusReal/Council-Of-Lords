import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { councilAPI } from '../../../services/api';

const UploadSection = ({ onUpload, onAnalysisStart, onAnalysisComplete }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    console.log('File selected:', file.name);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const analyzeWithCouncil = async () => {
    if (!selectedFile) {
      alert('Please select a file first!');
      return;
    }

    setIsAnalyzing(true);
    onAnalysisStart && onAnalysisStart();

    try {
      console.log('Starting ensemble analysis');
      
      const result = await councilAPI.analyzeFile(selectedFile);
      
      console.log('Ensemble response:', result);
      console.log('Verdict:', result.verdict);
      console.log('Confidence:', result.confidence);
      console.log('Individual votes:', result.individual_votes);
      console.log('Red flags:', result.red_flags);
      console.log('Pipeline logs:', result.pipeline_logs);
      
      // Transform the backend result to match frontend expectations
      const transformedResult = {
        totalExoplanets: result.verdict === 'EXOPLANET' ? 1 : 0,
        confidence: Math.round(result.confidence * 100),
        analysisTime: `${result.processing_time.toFixed(1)}s`,
        detectionMethods: ['Council AI Ensemble'],
        discoveries: result.verdict === 'EXOPLANET' ? [
          {
            id: 1,
            name: result.filename || selectedFile.name,
            confidence: Math.round(result.confidence * 100),
            method: "Council AI Ensemble",
            type: result.star_type ? `${result.star_type}-type` : "G-type",
            radius: result.koi_prad ? `${result.koi_prad.toFixed(2)} R⊕` : "Unknown",
            period: result.koi_period ? `${result.koi_period.toFixed(1)} days` : "Unknown",
            // Raw values for visualization
            radiusValue: result.koi_prad || 1.0,
            periodValue: result.koi_period || 365.0,
            starType: result.star_type || "G",
            transitDepth: result.advanced_detection?.transit_depth || 0.01
          }
        ] : [],
        councilVerdict: result.verdict,
        redFlags: result.red_flags || [],
        individualVotes: result.individual_votes || {},
        message: result.message || '',
        pipelineLogs: result.pipeline_logs || [],
        
        // Stellar catalog data from the backend
        stellar_mass: result.stellar_mass,
        stellar_radius: result.stellar_radius,
        stellar_temperature: result.stellar_temperature,
        stellar_luminosity: result.stellar_luminosity,
        stellar_distance: result.stellar_distance,
        catalog_source: result.catalog_source,
        
        // 🪐 PLANET DATA - PASS THROUGH FROM BACKEND! 🪐
        koi_period: result.koi_period,
        koi_prad: result.koi_prad,
        
        // Detection diagnostics
        advanced_detection: result.advanced_detection,
        signal_analysis: result.signal_analysis
      };

      onAnalysisComplete && onAnalysisComplete(transformedResult);
      
    } catch (error) {
      console.error('Council analysis failed:', error);
      alert(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Upload Your Dataset
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Drag and drop your exoplanet data files or click to browse. Our AI Council will analyze your data using NASA-grade ensemble detection.
          </p>
        </motion.div>

        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50' 
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <motion.div 
              className="mx-auto mb-6"
              animate={{ 
                scale: isDragOver ? 1.1 : 1,
                rotate: isDragOver ? 5 : 0 
              }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </motion.div>

            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Drop your files here'}
            </h3>
            <p className="text-gray-500 mb-6">
              or{' '}
              <label className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.fits,.json,.txt,.hdf5,.dat"
                  onChange={handleFileInput}
                />
                browse to upload
              </label>
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {['CSV', 'FITS', 'JSON', 'TXT', 'HDF5'].map((format) => (
                <motion.span 
                  key={format}
                  className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600"
                  whileHover={{ scale: 1.05, backgroundColor: '#f3f4f6' }}
                >
                  {format}
                </motion.span>
              ))}
            </div>

            <motion.button
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                isAnalyzing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : selectedFile
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
              whileHover={!isAnalyzing ? { scale: 1.02 } : {}}
              whileTap={!isAnalyzing ? { scale: 0.98 } : {}}
              onClick={analyzeWithCouncil}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>COUNCIL DELIBERATING...</span>
                </div>
              ) : selectedFile ? (
                '🔥 SUMMON THE COUNCIL OF LORDS! 🔥'
              ) : (
                'Select File First'
              )}
            </motion.button>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Universal Format Support</h3>
            <p className="text-gray-600">Works with any dataset format from any telescope or mission</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">AI-powered analysis completes in seconds, not hours</p>
          </div>
          
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">NASA-Grade Accuracy</h3>
            <p className="text-gray-600">Ensemble of 12 AI models ensures maximum detection precision</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UploadSection;
