import React, { useState } from 'react';
import UniversalNavigation from '../../components/layout/UniversalNavigation';
import UniversalHeader from '../../components/layout/UniversalHeader';
import GlassModuleAdmin from '../../components/admin/GlassModuleAdmin';
import { ProtectedGlassComponent } from '../../hooks/useGlassModuleAccess';

export default function GlassModuleAdminPage() {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <ProtectedGlassComponent>
      <div className="min-h-screen bg-gray-50">
        <UniversalNavigation 
          currentPage="glass-admin" 
          isOpen={showSidebar}
          onClose={() => setShowSidebar(false)}
        />

        <UniversalHeader
          title="Glass Module Administration"
          subtitle="Manage glass types, pricing, and processing options"
          onMenuToggle={() => setShowSidebar(true)}
        />

        <GlassModuleAdmin />
      </div>
    </ProtectedGlassComponent>
  );
}