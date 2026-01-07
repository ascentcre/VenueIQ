'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { ContactsView } from '@/components/contacts/ContactsView';

export default function ContactsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-800">Contacts</h1>
          <p className="text-brown-600 mt-1">Manage your artists and agents</p>
        </div>
        <ContactsView />
      </div>
    </MainLayout>
  );
}

