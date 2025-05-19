import React from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';


export default function Sidebar() {
  const [selectedCategory, setSelectedCategory] = useState('4');
  const [selectedLesionType, setSelectedLesionType] = useState('');
  const { logout } = useAuth();

  const logoutClick = () =>{
    logout()
  }

  const biRadsCategories = [
    { value: '0', label: '0 - Incomplete/Needs Additional Imaging' },
    { value: '1', label: '1 - Negative' },
    { value: '2', label: '2 - Benign Finding' },
    { value: '3', label: '3 - Probably Benign' },
    { value: '4', label: '4 - Suspicious' },
    { value: '5', label: '5 - Highly Suspicious of Malignancy' },
    { value: '6', label: '6 - Known Biopsy-Proven Malignancy' }


  ];

  const lesionTypes = [
    { value: '', label: 'Select Lesion Type' },
    { value: 'mass', label: 'Mass' },
    { value: 'calcification', label: 'Calcification' },
    { value: 'architectural-distortion', label: 'Architectural Distortion' },
    { value: 'asymmetry', label: 'Asymmetry' },
    { value: 'focal-asymmetry', label: 'Focal Asymmetry' },
    { value: 'suspicious-lymph-node', label: 'Suspicious Lymph Node' },
    { value: 'skin-lesion', label: 'Skin Lesion' },
    { value: 'other', label: 'Other' }
  ];
  return (
    <div className="w-72  rounded-lg ">


      <div className='bg-white rounded-lg border-gray-300 border  p-4'>
        <h2 className="text-2xl font-bold mb-4">Annotation Tools</h2>
        <div className="space-y-4">
          <div>
            <p className="text-gray-600 mb-2">Lesion Type :</p>
            <select
              value={selectedLesionType}
              onChange={(e) => setSelectedLesionType(e.target.value)}
              className="w-full bg-gray-100 p-2 rounded-md border border-gray-300"
            >
              {lesionTypes.map((lesion) => (
                <option key={lesion.value} value={lesion.value}>
                  {lesion.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-gray-600 mb-2">BI-RADS Rating :</p>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-100 p-2 rounded-md border border-gray-300"
            >
              {biRadsCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          

          <button className="w-full bg-green-500 text-white py-3 rounded-md">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}