'use client'
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="py-6 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="relative w-48 h-12">
            <Image
              src="/logo.png"
              alt="SalesKik Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
              onClick={() => window.open('http://localhost:3001/login', '_blank')}
            >
              Login
            </button>
            <button 
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-blue-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              onClick={() => window.open('http://localhost:3001/register', '_blank')}
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </header>

      {/* Simple Hero */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-6">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            Stop Juggling Business Tools
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Complete business management for builders, contractors, and growing businesses. 
            One platform handles quotes, scheduling, invoicing, and customer management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="px-8 py-4 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-all"
              onClick={() => window.open('http://localhost:3001/register?plan=trades', '_blank')}
            >
              Start Free Trial - Trades
            </button>
            <button 
              className="px-8 py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-all"
              onClick={() => window.open('http://localhost:3001/register?plan=business', '_blank')}
            >
              Start Free Trial - Business
            </button>
          </div>
        </div>
      </section>

      {/* Simple Stats */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-orange-500 mb-2">10,000+</div>
              <div className="text-gray-600">Businesses Trust Us</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-500 mb-2">50%</div>
              <div className="text-gray-600">Time Saved Daily</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-700 mb-2">24/7</div>
              <div className="text-gray-600">Expert Support</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
