import { useState, useRef } from 'react';
import { Upload, Download, Scissors, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import {
  removeBackground,
  resizeImage,
  compressImage,
  downloadImage,
} from './utils/imageProcessor';

type ProcessType = 'none' | 'remove-bg' | 'resize' | 'compress';

type ResizePreset = {
  name: string;
  width: number;
  height: number;
  category: string;
};

const RESIZE_PRESETS: ResizePreset[] = [
  { name: 'Instagram Square', width: 1080, height: 1080, category: 'Social Media' },
  { name: 'Instagram Portrait', width: 1080, height: 1350, category: 'Social Media' },
  { name: 'Facebook Cover', width: 820, height: 312, category: 'Social Media' },
  { name: 'Twitter Post', width: 1200, height: 675, category: 'Social Media' },
  { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Social Media' },
  { name: 'HD (720p)', width: 1280, height: 720, category: 'Standard' },
  { name: 'Full HD (1080p)', width: 1920, height: 1080, category: 'Standard' },
  { name: '4K UHD', width: 3840, height: 2160, category: 'Standard' },
  { name: 'Profile Picture', width: 400, height: 400, category: 'Web' },
  { name: 'Banner Small', width: 728, height: 90, category: 'Web' },
  { name: 'Banner Large', width: 970, height: 250, category: 'Web' },
];

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [processType, setProcessType] = useState<ProcessType>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resizeWidth, setResizeWidth] = useState<number>(1080);
  const [resizeHeight, setResizeHeight] = useState<number>(1080);
  const [useCustomSize, setUseCustomSize] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Instagram Square');
  const [quality, setQuality] = useState<number>(80);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setProcessedUrl('');
      setProcessType('none');
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: ResizePreset) => {
    setSelectedPreset(preset.name);
    setResizeWidth(preset.width);
    setResizeHeight(preset.height);
    setUseCustomSize(false);
  };

  const handleProcess = async () => {
    if (!selectedFile || processType === 'none') return;

    setIsProcessing(true);
    try {
      let result = '';
      switch (processType) {
        case 'remove-bg':
          result = await removeBackground(selectedFile);
          break;
        case 'resize':
          result = await resizeImage(selectedFile, resizeWidth, resizeHeight);
          break;
        case 'compress':
          result = await compressImage(selectedFile, quality);
          break;
      }
      setProcessedUrl(result);
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (processedUrl) {
      const extension = processType === 'compress' ? 'jpg' : 'png';
      downloadImage(processedUrl, `processed-image.${extension}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      <main className="flex-1 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold text-gray-800 mb-3">
              Process Your Images Instantly
            </h2>
            <p className="text-gray-600 text-lg">
              Resize to preset sizes, and compress with ease
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-600" />
                Upload & Configure
              </h3>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-3 border-dashed border-cyan-300 rounded-xl p-12 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/50 transition-all duration-300 mb-6"
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-cyan-600" />
                <p className="text-gray-700 font-medium mb-2">
                  Click to upload an image
                </p>
                <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {selectedFile && (
                <div className="space-y-6 animate-slide-up">
                  <div className="text-sm text-gray-600 bg-cyan-50 p-3 rounded-lg">
                    <strong>Selected:</strong> {selectedFile.name}
                  </div>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-gray-700 font-medium mb-2 block">
                        Choose Operation
                      </span>
                      <div className="grid grid-cols-3 gap-3">
                        {/* <button
                          onClick={() => setProcessType('remove-bg')}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            processType === 'remove-bg'
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 hover:border-cyan-300'
                          }`}
                        >
                          <Scissors className="w-6 h-6" />
                          <span className="text-xs font-medium">Remove BG</span>
                        </button> */}
                        <button
                          onClick={() => setProcessType('resize')}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            processType === 'resize'
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 hover:border-cyan-300'
                          }`}
                        >
                          <Maximize2 className="w-6 h-6" />
                          <span className="text-xs font-medium">Resize</span>
                        </button>
                        <button
                          onClick={() => setProcessType('compress')}
                          className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                            processType === 'compress'
                              ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                              : 'border-gray-200 hover:border-cyan-300'
                          }`}
                        >
                          <Minimize2 className="w-6 h-6" />
                          <span className="text-xs font-medium">Compress</span>
                        </button>
                      </div>
                    </label>

                    {processType === 'resize' && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg animate-slide-up">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Size Options</span>
                          <button
                            onClick={() => setUseCustomSize(!useCustomSize)}
                            className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
                          >
                            {useCustomSize ? 'Use Presets' : 'Custom Size'}
                          </button>
                        </div>

                        {!useCustomSize ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                              {RESIZE_PRESETS.map((preset) => (
                                <button
                                  key={preset.name}
                                  onClick={() => handlePresetSelect(preset)}
                                  className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                                    selectedPreset === preset.name
                                      ? 'border-cyan-500 bg-cyan-50'
                                      : 'border-gray-200 hover:border-cyan-300 bg-white'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className="font-medium text-sm text-gray-800">
                                        {preset.name}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {preset.width} × {preset.height}
                                      </div>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                                      {preset.category}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Width (px)
                              </label>
                              <input
                                type="number"
                                value={resizeWidth}
                                onChange={(e) => {
                                  setResizeWidth(parseInt(e.target.value) || 1080);
                                  setSelectedPreset('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Height (px)
                              </label>
                              <input
                                type="number"
                                value={resizeHeight}
                                onChange={(e) => {
                                  setResizeHeight(parseInt(e.target.value) || 1080);
                                  setSelectedPreset('');
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {processType === 'compress' && (
                      <div className="p-4 bg-gray-50 rounded-lg animate-slide-up">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quality: {quality}%
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={quality}
                          onChange={(e) =>
                            setQuality(parseInt(e.target.value))
                          }
                          className="w-full h-2 bg-cyan-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleProcess}
                    disabled={processType === 'none' || isProcessing}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Process Image
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                Preview
              </h3>

              {!previewUrl && !processedUrl && (
                <div className="h-96 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl">
                  <div className="text-center text-gray-400">
                    <Upload className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No image uploaded yet</p>
                  </div>
                </div>
              )}

              {previewUrl && !processedUrl && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600">Original:</p>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto rounded-lg shadow-md animate-fade-in"
                  />
                </div>
              )}

              {processedUrl && (
                <div className="space-y-4 animate-fade-in">
                  <p className="text-sm font-medium text-gray-600">Processed:</p>
                  <img
                    src={processedUrl}
                    alt="Processed"
                    className="w-full h-auto rounded-lg shadow-md"
                  />
                  <button
                    onClick={handleDownload}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Download className="w-5 h-5" />
                    Download Image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div id="features" className="mt-20 grid md:grid-cols-3 gap-8">
            {/* <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-cyan-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Scissors className="w-6 h-6 text-cyan-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Background Removal
              </h4>
              <p className="text-gray-600 text-sm">
                Automatically remove backgrounds from your images with advanced detection.
              </p>
            </div> */}

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Maximize2 className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                Smart Resizing
              </h4>
              <p className="text-gray-600 text-sm">
                Resize images to any dimensions while maintaining quality and aspect ratio.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Minimize2 className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                File Compression
              </h4>
              <p className="text-gray-600 text-sm">
                Reduce file size without sacrificing quality. Perfect for web optimization.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
