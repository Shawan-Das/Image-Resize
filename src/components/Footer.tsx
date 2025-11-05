import { Github, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 py-8 px-4 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            {/* <p className="flex items-center gap-2 justify-center md:justify-start">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for image enthusiasts
            </p> */}
            <p className="text-sm text-gray-400 mt-1">
              © 2024 Shawan Das. All processing happens locally in your browser.
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href="#"
              className="hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/Shawan-Das"
              className="hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
              aria-label="Twitter"
            >
              {/* <Twitter className="w-5 h-5" /> */}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
