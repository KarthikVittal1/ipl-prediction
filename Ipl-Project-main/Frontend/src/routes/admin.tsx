import React, { useEffect, useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

interface Model {
  name: string;
  size: number;
  modified: number;
  type: string;
}

interface PerformanceMetrics {
  [key: string]: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    last_trained: string;
    training_samples: number;
  };
}

const AdminPanel: React.FC = () => {
  const [models, setModels] = useState<Model[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [modelsRes, perfRes] = await Promise.all([
        fetch('http://127.0.0.1:8002/admin/models'),
        fetch('http://127.0.0.1:8002/admin/performance'),
      ]);

      const modelsData = await modelsRes.json();
      const perfData = await perfRes.json();

      setModels(modelsData.models || []);
      setPerformance(perfData);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshModels = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('http://127.0.0.1:8002/admin/models/refresh', {
        method: 'POST',
      });
      const data = await response.json();
      alert(data.message);
      fetchData();
    } catch (err) {
      console.error('Failed to refresh models:', err);
      alert('Failed to refresh models');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

      {/* Model Management */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Model Management</h2>
          <button
            onClick={handleRefreshModels}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Reload Models'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {models.map((model) => (
                <tr key={model.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {model.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {model.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(model.size / 1024).toFixed(2)} KB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(model.modified * 1000).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Performance */}
      {performance && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Model Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(performance).map(([modelName, metrics]) => (
              <div key={modelName} className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold mb-3 capitalize">
                  {modelName.replace('_', ' ')}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="font-semibold">{(metrics.accuracy * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precision:</span>
                    <span className="font-semibold">{(metrics.precision * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recall:</span>
                    <span className="font-semibold">{(metrics.recall * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">F1 Score:</span>
                    <span className="font-semibold">{(metrics.f1_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Trained:</span>
                    <span className="font-semibold">{metrics.last_trained}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Training Samples:</span>
                    <span className="font-semibold">{metrics.training_samples}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const Route = createFileRoute('/admin')({
  component: AdminPanel,
});
