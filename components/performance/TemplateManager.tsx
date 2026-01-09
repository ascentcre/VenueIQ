'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Star, StarOff, X, Save } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  ticketLevels: Array<{
    id: string;
    tierName: string;
    price: number;
    quantityAvailable: number | null;
    marketingChannel: string | null;
  }>;
  customExpenses: Array<{
    id: string;
    expenseName: string;
    expenseAmount: number | null;
    category: string | null;
  }>;
  defaultValues: any;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ticketLevels: [] as Array<{ tierName: string; price: number; quantityAvailable: number | null; marketingChannel: string }>,
    customExpenses: [] as Array<{ expenseName: string; expenseAmount: number | null; category: string }>,
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/performance-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      const res = await fetch(`/api/performance-templates/${templateId}/set-default`, {
        method: 'POST',
      });
      if (res.ok) {
        await loadTemplates();
      }
    } catch (error) {
      console.error('Error setting default template:', error);
      alert('Failed to set default template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/performance-templates/${templateId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await loadTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      ticketLevels: template.ticketLevels.map(tl => ({
        tierName: tl.tierName,
        price: tl.price,
        quantityAvailable: tl.quantityAvailable,
        marketingChannel: tl.marketingChannel || '',
      })),
      customExpenses: template.customExpenses.map(ce => ({
        expenseName: ce.expenseName,
        expenseAmount: ce.expenseAmount,
        category: ce.category || '',
      })),
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        ticketLevels: formData.ticketLevels,
        customExpenses: formData.customExpenses,
        isDefault: editingTemplate?.isDefault || false,
      };

      const url = editingTemplate
        ? `/api/performance-templates/${editingTemplate.id}`
        : '/api/performance-templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadTemplates();
        setShowCreateModal(false);
        setEditingTemplate(null);
        setFormData({
          name: '',
          description: '',
          ticketLevels: [],
          customExpenses: [],
        });
      } else {
        alert('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const addTicketLevel = () => {
    setFormData({
      ...formData,
      ticketLevels: [...formData.ticketLevels, { tierName: '', price: 0, quantityAvailable: null, marketingChannel: '' }],
    });
  };

  const removeTicketLevel = (index: number) => {
    setFormData({
      ...formData,
      ticketLevels: formData.ticketLevels.filter((_, i) => i !== index),
    });
  };

  const updateTicketLevel = (index: number, field: string, value: any) => {
    const updated = [...formData.ticketLevels];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, ticketLevels: updated });
  };

  const addCustomExpense = () => {
    setFormData({
      ...formData,
      customExpenses: [...formData.customExpenses, { expenseName: '', expenseAmount: null, category: '' }],
    });
  };

  const removeCustomExpense = (index: number) => {
    setFormData({
      ...formData,
      customExpenses: formData.customExpenses.filter((_, i) => i !== index),
    });
  };

  const updateCustomExpense = (index: number, field: string, value: any) => {
    const updated = [...formData.customExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, customExpenses: updated });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brown-800">Performance Templates</h2>
          <p className="text-gray-600 mt-1">Create and manage templates for ticket levels and expenses</p>
        </div>
        <button
          onClick={() => {
            setEditingTemplate(null);
            setFormData({
              name: '',
              description: '',
              ticketLevels: [],
              customExpenses: [],
            });
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">No templates yet. Create your first template to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                    {template.isDefault && (
                      <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  )}
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{template.ticketLevels.length} ticket level{template.ticketLevels.length !== 1 ? 's' : ''}</span>
                    <span>{template.customExpenses.length} expense{template.customExpenses.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!template.isDefault && (
                    <button
                      onClick={() => handleSetDefault(template.id)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  {template.isDefault && (
                    <button
                      className="p-2 text-yellow-600 rounded-lg cursor-default"
                      title="Default template"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit template"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Standard Show, VIP Event"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this template..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Ticket Levels */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">Ticket Levels</label>
                  <button
                    type="button"
                    onClick={addTicketLevel}
                    className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Level
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.ticketLevels.map((tl, index) => (
                    <div key={index} className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Tier Name"
                        value={tl.tierName}
                        onChange={(e) => updateTicketLevel(index, 'tierName', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price"
                        value={tl.price || ''}
                        onChange={(e) => updateTicketLevel(index, 'price', parseFloat(e.target.value) || 0)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Qty Available (optional)"
                        value={tl.quantityAvailable || ''}
                        onChange={(e) => updateTicketLevel(index, 'quantityAvailable', e.target.value ? parseInt(e.target.value) : null)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Marketing Channel"
                        value={tl.marketingChannel}
                        onChange={(e) => updateTicketLevel(index, 'marketingChannel', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeTicketLevel(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Expenses */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-medium text-gray-700">Custom Expenses</label>
                  <button
                    type="button"
                    onClick={addCustomExpense}
                    className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Expense
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.customExpenses.map((ce, index) => (
                    <div key={index} className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Expense Name"
                        value={ce.expenseName}
                        onChange={(e) => updateCustomExpense(index, 'expenseName', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Amount (optional)"
                        value={ce.expenseAmount || ''}
                        onChange={(e) => updateCustomExpense(index, 'expenseAmount', e.target.value ? parseFloat(e.target.value) : null)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Category"
                        value={ce.category}
                        onChange={(e) => updateCustomExpense(index, 'category', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomExpense(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
