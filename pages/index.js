import React from 'react';
import Layout from '../components/Layout';
import ImageViewer from '../components/ImageViewer';
import MammoAnnotatePro from '../components/MammoAnnotatePro'

export default function Home() {
  // Sample case data
  const caseData = {
    id: 'MCP-2024-4872',
    patientAge: 54,
    date: '03/02/2025'
  };

  return (
    <Layout>
      <MammoAnnotatePro />
    </Layout>
  );
}