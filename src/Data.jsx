import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function Data() {
  const [data, setData] = useState({
    box1: createEmptyBox(),
    box2: createEmptyBox(),
    box3: createEmptyBox(),
  });

  const [isEditing, setIsEditing] = useState(false); 

  useEffect(() => {
    axios.get('https://index-backend.vercel.app/data')
      .then((res) => {
        if (res.data) setData(res.data);
      })
      .catch((err) => console.error('Error fetching data:', err));
  }, []);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (boxKey, levelKey, colName, index, value) => {
    setData((prev) => {
      const updated = { ...prev };
      updated[boxKey][levelKey][colName][index] = value;
      return { ...updated };
    });
  };

  const handleSave = () => {
    axios.post('https://index-backend.vercel.app/data', data)
      .then((res) => {
        // console.log(res.data);
        setIsEditing(false);
      })
      .catch((err) => console.error('Error saving data:', err));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Edit & Save buttons */}
      <div className="flex justify-end mb-4 gap-3">
        {!isEditing ? (
          <button
            onClick={handleEditToggle}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Edit
          </button>
        ) : (
          <>
            <button
              onClick={handleSave}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={handleEditToggle}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
            >
              Cancel
            </button>
          </>
        )}
      </div>

      <div className="flex justify-center space-x-9">
        {Object.entries(data).map(([boxKey, levels]) => (
          <div key={boxKey} className="w-full sm:w-[300px] space-y-9">
            <h2 className="text-2xl font-bold text-center text-[#2EE8B3] mb-2 tracking-wide">
              {boxKey.toUpperCase()}
            </h2>

            {Object.entries(levels).map(([levelKey, levelData]) => (
              <div
                key={levelKey}
                className="bg-white shadow-md rounded-lg border border-gray-200 hover:shadow-lg transition duration-300"
              >
                <div className="bg-[#2EE8B3] text-white px-4 py-2 text-center font-semibold text-sm tracking-wide uppercase rounded-t-lg">
                  {levelKey}
                </div>
                <div className="p-4">
                  <table className="w-full text-sm text-left border-separate border-spacing-y-1">
                    <thead>
                      <tr className="text-gray-700 bg-gray-100">
                        <th className="py-2 px-3 rounded-l-md">Col 1</th>
                        <th className="py-2 px-3 rounded-r-md">Col 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levelData?.col1?.map((val, i) => (
                        <tr key={i} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={val}
                                onChange={(e) =>
                                  handleInputChange(boxKey, levelKey, 'col1', i, e.target.value)
                                }
                                className="w-full border rounded px-2 py-1"
                              />
                            ) : (
                              val
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <input
                                type="number"
                                value={levelData?.col2[i]}
                                onChange={(e) =>
                                  handleInputChange(boxKey, levelKey, 'col2', i, e.target.value)
                                }
                                className="w-full border rounded px-2 py-1"
                              />
                            ) : (
                              levelData?.col2[i]
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function createEmptyBox() {
  return {
    level1: { col1: [], col2: [] },
    level2: { col1: [], col2: [] },
    level3: { col1: [], col2: [] },
    level4: { col1: [], col2: [] },
  };
}
