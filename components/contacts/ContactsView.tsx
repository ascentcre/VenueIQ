'use client';

import { useState, useEffect } from 'react';
import { Plus, Mail, Phone, Tag, User } from 'lucide-react';
import { ContactModal } from './ContactModal';

export function ContactsView() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'artist' | 'agent'>('all');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/contacts');
      if (response.ok) {
        const data = await response.json();
        setContacts(data);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    if (filter === 'all') return true;
    return contact.type === filter;
  });

  const handleCreateContact = () => {
    setSelectedContact(null);
    setIsModalOpen(true);
  };

  const handleEditContact = (contact: any) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
    fetchContacts();
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('artist')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'artist'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Artists
          </button>
          <button
            onClick={() => setFilter('agent')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'agent'
                ? 'bg-teal-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Agents
          </button>
        </div>
        <button
          onClick={handleCreateContact}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => handleEditContact(contact)}
            className="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold text-brown-800">{contact.name}</h3>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${
                contact.type === 'artist'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-brown-100 text-brown-800'
              }`}>
                {contact.type}
              </span>
            </div>

            {contact.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Mail className="w-4 h-4" />
                {contact.email}
              </div>
            )}

            {contact.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Phone className="w-4 h-4" />
                {contact.phone}
              </div>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {contact.tags.map((tag: any) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-xs"
                  >
                    <Tag className="w-3 h-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No contacts found. Create your first contact to get started.</p>
        </div>
      )}

      {isModalOpen && (
        <ContactModal
          contact={selectedContact}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

