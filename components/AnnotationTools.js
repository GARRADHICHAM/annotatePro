import React from 'react';

export default function AnnotationTools() {

  const [selectedCategory, setSelectedCategory] = useState('4');

  const biRadsCategories = [
    { value: '0', label: '0 - Incomplete/Needs Additional Imaging' },
    { value: '1', label: '1 - Negative' },
    { value: '2', label: '2 - Benign Finding' },
    { value: '3', label: '3 - Probably Benign' },
    { value: '4', label: '4 - Suspicious' },
    { value: '5', label: '5 - Highly Suspicious of Malignancy' },
    { value: '6', label: '6 - Known Biopsy-Proven Malignancy' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg mb-4">
      <h2 className="text-2xl font-bold mb-4">Annotation Tools</h2>
      <div className="space-y-4">
        <div>
          <p className="text-gray-600 mb-2">Lesion Type :</p>
          <div className="bg-gray-100 p-3 rounded-md">
            <p>Mass</p>
          </div>
        </div>

        <div>
          <p className="text-gray-600 mb-2">BI-RADS Rating :</p>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full bg-gray-100">
              <SelectValue placeholder="Select BI-RADS Category" />
            </SelectTrigger>
            <SelectContent>
              {biRadsCategories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button className="w-full bg-blue-500 text-white py-3 rounded-md mt-6">
          Brush Tool
        </button>

        <button className="w-full bg-red-500 text-white py-3 rounded-md">
          Eraser Tool
        </button>

        <button className="w-full bg-green-500 text-white py-3 rounded-md">
          Save
        </button>
      </div>
    </div>
  );
}