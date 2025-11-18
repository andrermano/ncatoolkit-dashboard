'use client';

import { useState } from 'react';
import ConvertForm from '@/components/ConvertForm';
import TranscribeForm from '@/components/TranscribeForm';
import { FileVideo, Mic, Download, Settings } from 'lucide-react';
import Link from 'next/link';

type ActiveTab = 'convert' | 'transcribe' | 'download';

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('convert');

  const tabs = [
    { id: 'convert', label: 'Convert', icon: FileVideo },
    { id: 'transcribe', label: 'Transcribe', icon: Mic },
    { id: 'download', label: 'Download', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                No-Code Architects Toolkit
              </h1>
              <p className="text-gray-600 mt-1">
                Professional media processing dashboard
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              {/* versão atualizada */}
              <span className="text-sm text-gray-500">v1.1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex items-stretch border-b border-gray-200">
            {/* abas originais */}
            <div className="flex flex-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* link para a nova tela de batch */}
            <Link
              href="/image-to-video"
              className="flex items-center justify-center px-4 py-3 text-sm font-semibold text-purple-700 border-l border-gray-200 bg-purple-50 hover:bg-purple-100 transition-colors whitespace-nowrap"
            >
              Image → Video (batch)
            </Link>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'convert' && <ConvertForm />}
          {activeTab === 'transcribe' && <TranscribeForm />}
          {activeTab === 'download' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Download Feature
              </h3>
              <p className="text-gray-600">
                Coming soon! This feature will allow you to download media from various sources.
              </p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Fast Processing</h3>
            <p className="text-sm text-gray-600">
              Powered by FFmpeg and optimized for speed
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
            <p className="text-sm text-gray-600">
              API keys stored securely on the server
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Open Source</h3>
            <p className="text-sm text-gray-600">
              GPL-2.0 licensed, free to use and modify
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              Built with Next.js • Powered by No-Code Architects Toolkit API
            </p>
            <p className="mt-2">
              <a
                href="https://github.com/Davidb-2107/no-code-architects-toolkit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

