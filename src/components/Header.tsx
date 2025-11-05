import { Image } from 'lucide-react';

export const Header = () => {
  return (
    <header className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-6 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            <Image className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">ImageCraft</h1>
            <p className="text-sm text-cyan-100">Easy Image Processing Online</p>
          </div>
        </div>
        <nav className="hidden md:flex gap-6">
          <a href="#features" className="hover:text-cyan-100 transition-colors">
            Features
          </a>
          {/* <a href="#about" className="hover:text-cyan-100 transition-colors">
            About
          </a> */}
        </nav>
      </div>
    </header>
  );
};
