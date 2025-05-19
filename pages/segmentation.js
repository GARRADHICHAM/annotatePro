import React from 'react';
import Layout from '../components/Layout';
import ImageUploader from '../components/ImageUploader';

export default function Segmentation() {
    // Sample case data
    const caseData = {
        id: 'MCP-2024-4872',
        patientAge: 54,
        date: '03/02/2025'
    };

    return (
        <Layout>
            <ImageUploader />
        </Layout>
    );
}