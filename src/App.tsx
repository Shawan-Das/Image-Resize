import { useState, useRef } from 'react';
import { Upload, Download, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import {
  removeBackground,
  resizeImage,
  compressImage,
  downloadImage,
  exportImage,
  formatFileSize,
  getDataUrlSize,
  findQualityForTargetSize,
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
  // { name: 'YouTube Thumbnail', width: 1280, height: 720, category: 'Social Media' },
  // { name: 'HD (720p)', width: 1280, height: 720, category: 'Standard' },
  { name: 'Full HD (1080p)', width: 1920, height: 1080, category: 'Standard' },
  // { name: '4K UHD', width: 3840, height: 2160, category: 'Standard' },
  // { name: 'Profile Picture', width: 400, height: 400, category: 'Web' },
  // { name: 'Banner Small', width: 728, height: 90, category: 'Web' },
  // { name: 'Banner Large', width: 970, height: 250, category: 'Web' },
];

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [processedUrl, setProcessedUrl] = useState<string>('');
  const [processType, setProcessType] = useState<ProcessType>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  // removed estimatedSize state - we no longer display live estimates
  const [targetSizeKB, setTargetSizeKB] = useState<number | null>(null);
  const [resizeWidth, setResizeWidth] = useState<number>(1080);
  const [resizeHeight, setResizeHeight] = useState<number>(1080);
  const [useCustomSize, setUseCustomSize] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('Instagram Square');
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number | null>(null);
  const [customMode, setCustomMode] = useState<'pixel' | 'percent'>('pixel');
  const [customWidthInput, setCustomWidthInput] = useState<string>('1080');
  const [customHeightInput, setCustomHeightInput] = useState<string>('1080');
  // user-entered target size in KB (we will find quality when processing)
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<'png' | 'jpeg' | 'webp' | 'io'>('png');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('File is too large — maximum allowed size is 10 MB.');
        // clear any previously selected file
        setSelectedFile(null);
        setPreviewUrl('');
        setProcessedUrl('');
        return;
      }
      setErrorMessage('');
      setSelectedFile(file);
      setProcessedUrl('');
      setProcessType('none');
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setPreviewUrl(src);
        // measure original image dimensions
        const img = new Image();
        img.onload = () => {
          setOriginalWidth(img.width);
          setOriginalHeight(img.height);
          // initialize custom inputs to image size
          setCustomWidthInput(String(img.width));
          setCustomHeightInput(String(img.height));
          // if user hasn't chosen a preset yet, default resize size to original
          setResizeWidth(img.width);
          setResizeHeight(img.height);
        };
        img.src = src;
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

  const getBadgeClasses = (category: string) => {
    switch (category) {
      case 'Social Media':
        return 'text-cyan-800 bg-cyan-100';
      case 'Standard':
        return 'text-blue-800 bg-blue-100';
      case 'Web':
        return 'text-emerald-800 bg-emerald-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
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
        case 'resize': {
          // compute final width/height (support percent custom mode)
          let finalW = resizeWidth;
          let finalH = resizeHeight;
          if (useCustomSize && customMode === 'percent' && originalWidth && originalHeight) {
            const pw = parseInt(customWidthInput || '0') || 0;
            const ph = parseInt(customHeightInput || '0') || 0;
            finalW = Math.max(1, Math.round(originalWidth * (pw / 100)));
            finalH = Math.max(1, Math.round(originalHeight * (ph / 100)));
          }
          result = await resizeImage(selectedFile, finalW, finalH);
          break;
        }
        case 'compress': {
          if (targetSizeKB && previewUrl) {
            const targetBytes = targetSizeKB * 1024;
            try {
              const res = await findQualityForTargetSize(previewUrl, targetBytes);
              result = await exportImage(previewUrl, 'jpeg', res.quality);
            } catch (err) {
              console.error('Error finding quality for target size', err);
              result = previewUrl ? await exportImage(previewUrl, 'jpeg', 80) : await compressImage(selectedFile, 80);
            }
          } else {
            result = previewUrl ? await exportImage(previewUrl, 'jpeg', 80) : await compressImage(selectedFile, 80);
          }
          break;
        }
      }
      setProcessedUrl(result);
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    (async () => {
      const src = processedUrl || previewUrl;
      if (!src) return;

      try {

        const exportFormat = outputFormat === 'io' ? 'png' : outputFormat;
        let converted: string;

        if (processedUrl) {
          converted = processedUrl;
        } else if (processType === 'compress' && targetSizeKB && previewUrl) {
          const targetBytes = targetSizeKB * 1024;
          const res = await findQualityForTargetSize(previewUrl, targetBytes);
          // export with the found quality (note: size-targeting uses jpeg internally)
          converted = await exportImage(previewUrl, 'jpeg', res.quality);
        } else {
          // no processing result — export at a default quality
          converted = await exportImage(src, exportFormat as 'png' | 'jpeg' | 'webp', 80);
        }

        const base = selectedFile ? selectedFile.name.replace(/\.[^/.]+$/, '') : 'processed-image';
        const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
        downloadImage(converted, `${base}.${ext}`);
      } catch (err) {
        console.error('Download/convert error:', err);
      }
    })();
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
                <p className="text-sm text-gray-500">Any image type (PNG, JPG, GIF, WEBP, ICO, etc.) — up to 10 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {errorMessage && (
                <div className="text-sm text-red-600 mb-4">{errorMessage}</div>
              )}

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

                        {/* Show original and estimated sizes */}
                        <div className="mb-3 text-sm text-gray-600">
                          <div>
                            <strong>Original:</strong>{' '}
                            {originalWidth && originalHeight
                              ? `${originalWidth} × ${originalHeight} px`
                              : '—'}
                          </div>
                          <div>
                            <strong>Estimated resized:</strong>{' '}
                            {/* compute estimated value from current inputs */}
                            {customMode === 'percent' && originalWidth && originalHeight
                              ? `${Math.round(originalWidth * (parseInt(customWidthInput || '0') / 100))} × ${Math.round(originalHeight * (parseInt(customHeightInput || '0') / 100))} px`
                              : `${resizeWidth} × ${resizeHeight} px`}
                          </div>
                        </div>

                        {!useCustomSize ? (
                          <div className="space-y-3">
                            <div className="flex gap-2 flex-wrap mb-2">
                              <button
                                onClick={() => {
                                  if (!originalWidth || !originalHeight) return;
                                  const w = Math.round(originalWidth * 0.25);
                                  const h = Math.round(originalHeight * 0.25);
                                  setResizeWidth(w);
                                  setResizeHeight(h);
                                  setCustomWidthInput(String(25));
                                  setCustomHeightInput(String(25));
                                  setCustomMode('percent');
                                  setSelectedPreset('');
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 text-sm"
                              >
                                25% of original
                              </button>
                              <button
                                onClick={() => {
                                  if (!originalWidth || !originalHeight) return;
                                  const w = Math.round(originalWidth * 0.5);
                                  const h = Math.round(originalHeight * 0.5);
                                  setResizeWidth(w);
                                  setResizeHeight(h);
                                  setCustomWidthInput(String(50));
                                  setCustomHeightInput(String(50));
                                  setCustomMode('percent');
                                  setSelectedPreset('');
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 text-sm"
                              >
                                50% of original
                              </button>
                              <button
                                onClick={() => {
                                  if (!originalWidth || !originalHeight) return;
                                  const w = Math.round(originalWidth * 0.75);
                                  const h = Math.round(originalHeight * 0.75);
                                  setResizeWidth(w);
                                  setResizeHeight(h);
                                  setCustomWidthInput(String(75));
                                  setCustomHeightInput(String(75));
                                  setCustomMode('percent');
                                  setSelectedPreset('');
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 text-sm"
                              >
                                75% of original
                              </button>
                              <button
                                onClick={() => {
                                  setResizeWidth(1280);
                                  setResizeHeight(1920);
                                  setCustomWidthInput('1280');
                                  setCustomHeightInput('1920');
                                  setCustomMode('pixel');
                                  setSelectedPreset('');
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 text-sm"
                              >
                                1280 × 1920
                              </button>
                              <button
                                onClick={() => {
                                  setResizeWidth(1024);
                                  setResizeHeight(1536);
                                  setCustomWidthInput('1024');
                                  setCustomHeightInput('1536');
                                  setCustomMode('pixel');
                                  setSelectedPreset('');
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 text-sm"
                              >
                                1024 × 1536
                              </button>
                              <button
                                onClick={() => {
                                  setResizeWidth(800);
                                  setResizeHeight(1200);
                                  setCustomWidthInput('800');
                                  setCustomHeightInput('1200');
                                  setCustomMode('pixel');
                                  setSelectedPreset('');
                                }}
                                className="px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-cyan-50 text-sm"
                              >
                                800 × 1200
                              </button>
                            </div>

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
                                    <span className={`text-xs px-2 py-1 rounded ${getBadgeClasses(preset.category)}`}>
                                      {preset.category}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Width
                                </label>
                                <input
                                  type="text"
                                  value={customWidthInput}
                                  onChange={(e) => {
                                    setCustomWidthInput(e.target.value);
                                    const val = parseInt(e.target.value);
                                    if (isNaN(val) || val <= 0) return;
                                    if (customMode === 'pixel') {
                                      setResizeWidth(val);
                                    } else if (originalWidth) {
                                      setResizeWidth(Math.round(originalWidth * (val / 100)));
                                    }
                                    setSelectedPreset('');
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Height
                                </label>
                                <input
                                  type="text"
                                  value={customHeightInput}
                                  onChange={(e) => {
                                    setCustomHeightInput(e.target.value);
                                    const val = parseInt(e.target.value);
                                    if (isNaN(val) || val <= 0) return;
                                    if (customMode === 'pixel') {
                                      setResizeHeight(val);
                                    } else if (originalHeight) {
                                      setResizeHeight(Math.round(originalHeight * (val / 100)));
                                    }
                                    setSelectedPreset('');
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={customMode === 'pixel'}
                                  onChange={() => setCustomMode('pixel')}
                                />
                                <span className="text-sm">Pixels (px)</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  checked={customMode === 'percent'}
                                  onChange={() => setCustomMode('percent')}
                                />
                                <span className="text-sm">Percent of original (%)</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {processType === 'compress' && (
                      <div className="p-4 bg-gray-50 rounded-lg animate-slide-up space-y-4">
                        <div className="text-sm space-y-1">
                          <p className="font-medium text-gray-700">Original size: {formatFileSize(getDataUrlSize(previewUrl))}</p>
                        </div>

                        <div className="pt-2 border-t border-gray-200">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target size (KB)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              min="1"
                              placeholder="e.g. 300"
                              value={targetSizeKB || ''}
                              onChange={(e) => {
                                const kb = parseInt(e.target.value);
                                if (!isNaN(kb) && kb > 0) {
                                  setTargetSizeKB(kb);
                                } else {
                                  setTargetSizeKB(null);
                                }
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-600 py-2">KB</span>
                            <div className="text-xs text-gray-500 ml-3">We will attempt to match this size when you press Process</div>
                          </div>
                        </div>
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

              {(previewUrl || processedUrl) && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600">{processedUrl ? 'Processed:' : 'Original:'}</p>
                  <img
                    src={processedUrl || previewUrl}
                    alt={processedUrl ? 'Processed' : 'Preview'}
                    className="w-full h-auto rounded-lg shadow-md animate-fade-in"
                  />

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <label className="flex items-center gap-3">
                      <span className="text-sm font-medium">Download as</span>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value as any)}
                        className="ml-2 px-3 py-2 border border-gray-200 rounded-lg bg-white"
                      >
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WEBP</option>
                      </select>
                    </label>

                    <button
                      onClick={handleDownload}
                      className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                    >
                      <Download className="w-5 h-5" />
                      Download Image
                    </button>
                  </div>
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
