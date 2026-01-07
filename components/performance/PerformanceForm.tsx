'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronUp, Save, X, Plus, Trash2 } from 'lucide-react';

// Zod schema for validation
const ticketLevelSchema = z.object({
  tierName: z.string().min(1, 'Tier name is required'),
  price: z.number().min(0, 'Price must be >= 0'),
  quantityAvailable: z.number().min(0, 'Quantity must be >= 0'),
  quantitySold: z.number().min(0, 'Quantity must be >= 0'),
  marketingChannel: z.string().optional(),
});

const customExpenseSchema = z.object({
  expenseName: z.string().min(1, 'Expense name is required'),
  expenseAmount: z.number().min(0, 'Amount must be >= 0'),
  category: z.string().optional(),
});

const performanceFormSchema = z.object({
  // Event Basics
  eventDate: z.string().min(1, 'Event date is required'),
  eventTime: z.string().min(1, 'Event time is required'),
  eventName: z.string().min(1, 'Event name is required'),
  artistId: z.string().optional(),
  agentId: z.string().optional(),
  genre: z.enum(['Rock', 'Jazz', 'Hip-Hop', 'Country', 'Electronic', 'Blues', 'Folk', 'Comedy', 'Other']),
  venueCapacity: z.number().min(1, 'Venue capacity must be > 0'),
  
  // Attendance
  ticketsSold: z.number().min(0, 'Tickets sold must be >= 0'),
  compTickets: z.number().min(0).default(0),
  advanceSales30Plus: z.number().min(0).default(0),
  advanceSales7to30: z.number().min(0).default(0),
  advanceSalesWeekOf: z.number().min(0).default(0),
  advanceSalesDayOf: z.number().min(0).default(0),
  doorSales: z.number().min(0).default(0),
  
  // Ticket Levels
  ticketLevels: z.array(ticketLevelSchema).default([]),
  
  // Deal Structure
  dealType: z.enum(['Versus', 'Flat Guarantee', 'Percentage', 'Hybrid']),
  artistGuarantee: z.number().min(0).optional().nullable(),
  percentageSplit: z.number().min(0, 'Percentage must be >= 0').max(100, 'Percentage must be <= 100').optional().nullable(),
  hybridDoorSplitPoint: z.number().min(0).optional().nullable(),
  merchSplitType: z.enum(['Percentage', 'Flat Fee'], {
    errorMap: () => ({ message: 'Please select a merch split type' })
  }).default('Percentage'),
  merchSplitValue: z.number().min(0, 'Merch split value must be >= 0').default(0),
  productionCosts: z.number().min(0).default(0),
  
  // Revenue Streams
  facilityFeesKept: z.number().min(0).default(0),
  ticketingFeesPaidToPlatform: z.number().min(0).default(0),
  taxes: z.number().min(0).default(0),
  fbSales: z.number().min(0).default(0),
  totalMerchSales: z.number().min(0).default(0),
  parkingRevenue: z.number().min(0).default(0),
  otherRevenue: z.number().min(0).default(0),
  
  // Operating Expenses
  bartenderHours: z.number().min(0).default(0),
  bartenderRate: z.number().min(0).default(0),
  securityHours: z.number().min(0).default(0),
  securityRate: z.number().min(0).default(0),
  soundLightingTech: z.number().min(0).default(0),
  doorBoxOfficeHours: z.number().min(0).default(0),
  doorBoxOfficeRate: z.number().min(0).default(0),
  fbCostOfGoods: z.number().min(0).default(0),
  creditCardFees: z.number().min(0).default(0),
  ticketPlatformFees: z.number().min(0).default(0),
  customExpenses: z.array(customExpenseSchema).default([]),
  
  // Marketing
  marketingSpend: z.number().min(0).default(0),
  socialMediaAds: z.number().min(0).default(0),
  emailMarketing: z.number().min(0).default(0),
  printRadioOther: z.number().min(0).default(0),
  estimatedReach: z.number().min(0).default(0),
  newCustomersAcquired: z.number().min(0).default(0),
  
  // Post-Event Notes
  whatWorkedWell: z.string().optional().nullable(),
  whatDidntWork: z.string().optional().nullable(),
  bookAgain: z.enum(['Yes', 'No', 'Maybe']).optional().nullable(),
  bookAgainNotes: z.string().optional().nullable(),
  agentRating: z.number().min(1).max(5).optional().nullable(),
  audienceNotes: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  // Validate tickets sold doesn't exceed capacity
  if (data.ticketsSold > data.venueCapacity) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tickets sold cannot exceed venue capacity',
      path: ['ticketsSold'],
    });
  }
  
  // Validate advance sales sum equals tickets sold (only if tickets sold > 0 and user has filled in advance sales)
  if (data.ticketsSold > 0) {
    const sum = (data.advanceSales30Plus || 0) + (data.advanceSales7to30 || 0) + 
                (data.advanceSalesWeekOf || 0) + (data.advanceSalesDayOf || 0) + 
                (data.doorSales || 0);
    // Only validate if user has filled in at least one advance sales field AND the sum doesn't match
    // Allow a small tolerance (1 ticket) for rounding differences
    const hasAdvanceSalesData = sum > 0;
    if (hasAdvanceSalesData && Math.abs(sum - data.ticketsSold) > 1) {
      const errorMessage = `Advance sales breakdown (${sum}) must equal tickets sold (${data.ticketsSold}). Please adjust the sales timeline fields.`;
      // Add error to the first field to avoid cluttering the form
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: errorMessage,
        path: ['advanceSales30Plus'],
      });
    }
  }
  
  // Validate deal type requirements
  if (data.dealType === 'Percentage' || data.dealType === 'Versus' || data.dealType === 'Hybrid') {
    if (data.percentageSplit === undefined || data.percentageSplit === null || data.percentageSplit <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage split is required for this deal type',
        path: ['percentageSplit'],
      });
    }
  }
  
  if (data.dealType === 'Hybrid') {
    if (data.hybridDoorSplitPoint === undefined || data.hybridDoorSplitPoint === null || data.hybridDoorSplitPoint <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Door split point is required for hybrid deals',
        path: ['hybridDoorSplitPoint'],
      });
    }
  }
  
  if ((data.dealType === 'Flat Guarantee' || data.dealType === 'Hybrid') && 
      (data.artistGuarantee === undefined || data.artistGuarantee === null || data.artistGuarantee <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Artist guarantee is required for this deal type',
      path: ['artistGuarantee'],
    });
  }
});

type PerformanceFormData = z.infer<typeof performanceFormSchema>;

interface PerformanceFormProps {
  eventId?: string | null;
  onSave: () => void;
  onCancel: () => void;
}

export function PerformanceForm({ eventId, onSave, onCancel }: PerformanceFormProps) {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0])); // Section 0 expanded by default
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [venue, setVenue] = useState<{ capacity: number } | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<Array<{ id: string; title: string; artistName?: string; startDate: string; performance?: any }>>([]);
  const [selectedCalendarEventId, setSelectedCalendarEventId] = useState<string | null>(eventId || null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<PerformanceFormData>({
    resolver: zodResolver(performanceFormSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      // Required fields with defaults
      genre: 'Rock' as const,
      dealType: 'Flat Guarantee' as const,
      merchSplitType: 'Percentage' as const,
      merchSplitValue: 0,
      venueCapacity: venue?.capacity || 0,
      ticketsSold: 0,
      // Optional fields that need explicit defaults
      artistGuarantee: null,
      percentageSplit: null,
      hybridDoorSplitPoint: null,
      // Optional fields with defaults
      compTickets: 0,
      advanceSales30Plus: 0,
      advanceSales7to30: 0,
      advanceSalesWeekOf: 0,
      advanceSalesDayOf: 0,
      doorSales: 0,
      ticketLevels: [],
      productionCosts: 0,
      facilityFeesKept: 0,
      ticketingFeesPaidToPlatform: 0,
      taxes: 0,
      fbSales: 0,
      totalMerchSales: 0,
      parkingRevenue: 0,
      otherRevenue: 0,
      bartenderHours: 0,
      bartenderRate: 0,
      securityHours: 0,
      securityRate: 0,
      soundLightingTech: 0,
      doorBoxOfficeHours: 0,
      doorBoxOfficeRate: 0,
      fbCostOfGoods: 0,
      creditCardFees: 0,
      ticketPlatformFees: 0,
      customExpenses: [],
      marketingSpend: 0,
      socialMediaAds: 0,
      emailMarketing: 0,
      printRadioOther: 0,
      estimatedReach: 0,
      newCustomersAcquired: 0,
    },
  });

  const { fields: ticketLevelFields, append: appendTicketLevel, remove: removeTicketLevel } = useFieldArray({
    control,
    name: 'ticketLevels',
  });

  const { fields: customExpenseFields, append: appendCustomExpense, remove: removeCustomExpense } = useFieldArray({
    control,
    name: 'customExpenses',
  });

  // Watch form values for calculations
  const watchedValues = watch();
  const ticketsSold = watch('ticketsSold') || 0;
  const venueCapacity = watch('venueCapacity') || 0;
  const ticketLevels = watch('ticketLevels') || [];

  // Calculate gross ticket sales from ticket levels
  const grossTicketSales = ticketLevels.reduce(
    (sum, level) => sum + ((level.price || 0) * (level.quantitySold || 0)),
    0
  );

  // Calculate capacity utilization
  const capacityUtilization = venueCapacity > 0 ? (ticketsSold / venueCapacity) * 100 : 0;

  // Load contacts, venue data, and calendar events
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsRes, venueRes, eventsRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/venue/current'),
          fetch('/api/events'),
        ]);

        if (contactsRes.ok) {
          const contactsData = await contactsRes.json();
          setContacts(contactsData);
        }

        if (venueRes.ok) {
          const venueData = await venueRes.json();
          setVenue(venueData);
          if (venueData?.capacity) {
            setValue('venueCapacity', venueData.capacity, { shouldValidate: false });
          }
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          // Filter for events that don't have performance data yet
          const eventsWithoutPerformance = eventsData.filter((event: any) => !event.performance);
          setCalendarEvents(eventsWithoutPerformance);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [setValue]);

  // Handle calendar event selection
  useEffect(() => {
    if (selectedCalendarEventId && !eventId) {
      const selectedEvent = calendarEvents.find(e => e.id === selectedCalendarEventId);
      if (selectedEvent) {
        // Populate form with calendar event data
        const eventDate = new Date(selectedEvent.startDate);
        setValue('eventDate', eventDate.toISOString().split('T')[0]);
        setValue('eventTime', eventDate.toTimeString().slice(0, 5));
        setValue('eventName', selectedEvent.title || selectedEvent.artistName || '');
      }
    }
  }, [selectedCalendarEventId, calendarEvents, setValue, eventId]);

  // Load existing performance data if editing
  useEffect(() => {
    if (eventId) {
      const loadPerformance = async () => {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/events/${eventId}/performance`);
          if (res.ok) {
            const data = await res.json();
            // Map the data to form format
            reset({
              eventDate: data.eventDate ? new Date(data.eventDate).toISOString().split('T')[0] : '',
              eventTime: data.eventTime || '',
              eventName: data.eventName || '',
              artistId: data.artistId || '',
              agentId: data.agentId || '',
              genre: data.genre || 'Rock',
              venueCapacity: data.capacity || venue?.capacity || 0,
              ticketsSold: data.ticketsSold || 0,
              compTickets: data.compTickets || 0,
              advanceSales30Plus: data.advanceSales30Plus || 0,
              advanceSales7to30: data.advanceSales7to30 || 0,
              advanceSalesWeekOf: data.advanceSalesWeekOf || 0,
              advanceSalesDayOf: data.advanceSalesDayOf || 0,
              doorSales: data.doorSales || 0,
              ticketLevels: data.ticketLevels?.map((tl: any) => ({
                tierName: tl.tierName,
                price: tl.price,
                quantityAvailable: tl.quantityAvailable,
                quantitySold: tl.quantitySold,
                marketingChannel: tl.marketingChannel,
              })) || [],
              dealType: data.dealType || 'Flat Guarantee',
              artistGuarantee: data.artistGuarantee || 0,
              percentageSplit: data.percentageSplit || 0,
              hybridDoorSplitPoint: data.doorPriceSplitPoint || 0,
              merchSplitType: data.merchCommissionType === 'percentage' ? 'Percentage' : 'Flat Fee',
              merchSplitValue: data.merchCommission || 0,
              productionCosts: data.productionCosts || 0,
              facilityFeesKept: data.facilityFeesKept || data.facilityFees || 0,
              ticketingFeesPaidToPlatform: data.ticketingFeesPaidToPlatform || 0,
              taxes: data.taxes || data.ticketTaxes || 0,
              fbSales: data.fbsalesTotal || data.fbSales || 0,
              totalMerchSales: data.merchSalesTotal || 0,
              parkingRevenue: data.parkingRevenue || 0,
              otherRevenue: data.otherRevenue || 0,
              bartenderHours: data.bartenderHours || 0,
              bartenderRate: data.bartenderRate || 0,
              securityHours: data.securityHours || 0,
              securityRate: data.securityRate || 0,
              soundLightingTech: data.soundLightingTech || 0,
              doorBoxOfficeHours: data.doorBoxOfficeHours || 0,
              doorBoxOfficeRate: data.doorBoxOfficeRate || 0,
              fbCostOfGoods: data.fbcogsDollar || 0,
              creditCardFees: data.creditCardFees || 0,
              ticketPlatformFees: data.ticketPlatformFeesTotal || 0,
              customExpenses: data.customExpenses?.map((ce: any) => ({
                expenseName: ce.expenseName,
                expenseAmount: ce.expenseAmount,
                category: ce.category,
              })) || [],
              marketingSpend: data.marketingSpend || 0,
              socialMediaAds: data.socialMediaAds || 0,
              emailMarketing: data.emailMarketing || 0,
              printRadioOther: data.printRadioOther || 0,
              estimatedReach: data.estimatedReach || 0,
              newCustomersAcquired: data.newCustomersAcquired || 0,
              whatWorkedWell: data.whatWorkedWell || '',
              whatDidntWork: data.whatDidntWork || '',
              bookAgain: data.bookAgain === 'yes' ? 'Yes' : data.bookAgain === 'no' ? 'No' : 'Maybe',
              bookAgainNotes: data.bookAgainNotes || '',
              agentRating: data.promoterRating || undefined,
              audienceNotes: data.audienceBehaviorNotes || '',
            });
          }
        } catch (error) {
          console.error('Error loading performance:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadPerformance();
    }
  }, [eventId, reset, venue]);

  const toggleSection = (sectionIndex: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionIndex)) {
      newExpanded.delete(sectionIndex);
    } else {
      newExpanded.add(sectionIndex);
    }
    setExpandedSections(newExpanded);
  };

  const onSubmit = async (data: PerformanceFormData) => {
    console.log('Form submitted with data:', data);
    setIsSaving(true);
    try {
      // Save performance data - keep eventDate and eventTime separate for API
      const performancePayload = {
        ...data,
        eventDate: new Date(data.eventDate + 'T' + data.eventTime).toISOString(),
        eventTime: data.eventTime, // Keep time separate
        capacity: data.venueCapacity,
        grossTicketSales,
        // Ensure all number fields are actually numbers, not strings
        ticketsSold: Number(data.ticketsSold) || 0,
        venueCapacity: Number(data.venueCapacity) || 0,
        // Include selected calendar event ID if one was selected
        selectedEventId: selectedCalendarEventId || undefined,
      };
      
      console.log('Saving performance data:', performancePayload);
      
      // Use different API endpoints based on whether eventId exists
      const apiUrl = eventId 
        ? `/api/events/${eventId}/performance`
        : '/api/performance';
      
      const performanceRes = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(performancePayload),
      });

      if (!performanceRes.ok) {
        const errorData = await performanceRes.json().catch(() => ({}));
        console.error('Performance save failed:', errorData);
        throw new Error(errorData.error || 'Failed to save performance data');
      }

      const savedData = await performanceRes.json();
      console.log('Performance saved successfully:', savedData);
      
      onSave();
    } catch (error: any) {
      console.error('Error saving performance:', error);
      alert(`Failed to save performance data: ${error.message || 'Please try again.'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const artists = contacts.filter(c => c.type === 'artist');
  const agents = contacts.filter(c => c.type === 'agent');

  const onError = (errors: any) => {
    console.error('Form validation errors:', errors);
    console.error('Form values:', watch());
    console.error('Error keys:', Object.keys(errors || {}));
    
    // Log each error in detail
    Object.entries(errors || {}).forEach(([key, error]: [string, any]) => {
      console.error(`Error for ${key}:`, {
        type: error?.type,
        message: error?.message,
        ref: error?.ref,
        fullError: error
      });
    });
    
    // Only scroll if there are actual errors
    if (errors && Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const firstError = errors[firstErrorField];
      console.error('First error field:', firstErrorField, 'Error details:', firstError);
      
      if (firstErrorField) {
        // Try multiple selectors
        let element = document.querySelector(`[name="${firstErrorField}"]`);
        if (!element) {
          // Try by id
          element = document.getElementById(firstErrorField);
        }
        if (!element && firstErrorField.includes('.')) {
          // For nested fields like ticketLevels.0.price
          const parts = firstErrorField.split('.');
          const fieldName = parts[parts.length - 1];
          element = document.querySelector(`[name="${fieldName}"]`);
        }
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Focus the element if it's an input
          if (element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
            element.focus();
          }
        } else {
          console.warn(`Could not find element for field: ${firstErrorField}`);
        }
      }
    } else {
      console.warn('onError called but no errors found. This might indicate a form submission issue.');
      console.warn('This could mean validation passed but submission was prevented for another reason.');
    }
  };

  const handleFormSubmit = handleSubmit(
    (data) => {
      console.log('Form validation passed, calling onSubmit');
      onSubmit(data);
    },
    (errors) => {
      console.log('Form validation failed, calling onError');
      onError(errors);
    }
  );

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      {/* Display validation errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
            {Object.entries(errors).map(([field, error]: [string, any]) => {
              const errorMessage = error?.message || 
                                  (typeof error === 'string' ? error : 'Invalid value') ||
                                  'Please check this field';
              return (
                <li key={field}>
                  <strong>{field}:</strong> {errorMessage}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Calendar Event Selector - only show when creating new performance (not editing) */}
      {!eventId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Calendar Event (Optional)
          </label>
          <p className="text-xs text-gray-600 mb-3">
            If this event already exists on your calendar, select it to avoid creating a duplicate. 
            If you don't see your event, you can create a new one by filling in the form below.
          </p>
          <select
            value={selectedCalendarEventId || ''}
            onChange={(e) => {
              const newValue = e.target.value || null;
              setSelectedCalendarEventId(newValue);
              if (newValue) {
                const selectedEvent = calendarEvents.find(ev => ev.id === newValue);
                if (selectedEvent) {
                  const eventDate = new Date(selectedEvent.startDate);
                  setValue('eventDate', eventDate.toISOString().split('T')[0]);
                  setValue('eventTime', eventDate.toTimeString().slice(0, 5));
                  setValue('eventName', selectedEvent.title || selectedEvent.artistName || '');
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">-- Create new event or select existing --</option>
            {calendarEvents.map((event) => (
              <option key={event.id} value={event.id}>
                {new Date(event.startDate).toLocaleDateString()} - {event.title || event.artistName || 'Untitled Event'}
              </option>
            ))}
          </select>
          {calendarEvents.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              No calendar events found without performance data. You can create a new event by filling in the form below.
            </p>
          )}
        </div>
      )}
      
      {/* Section 1: Event Basics */}
      <Section
        title="Event Basics"
        index={0}
        expanded={expandedSections.has(0)}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Date *
            </label>
            <input
              type="date"
              {...register('eventDate')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            {errors.eventDate && (
              <p className="text-red-500 text-xs mt-1">{errors.eventDate.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Time *
            </label>
            <input
              type="time"
              {...register('eventTime')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            {errors.eventTime && (
              <p className="text-red-500 text-xs mt-1">{errors.eventTime.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Event Name/Artist *
            </label>
            <input
              type="text"
              {...register('eventName')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            {errors.eventName && (
              <p className="text-red-500 text-xs mt-1">{errors.eventName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Genre *
            </label>
            <select
              {...register('genre')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="Rock">Rock</option>
              <option value="Jazz">Jazz</option>
              <option value="Hip-Hop">Hip-Hop</option>
              <option value="Country">Country</option>
              <option value="Electronic">Electronic</option>
              <option value="Blues">Blues</option>
              <option value="Folk">Folk</option>
              <option value="Comedy">Comedy</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artist
            </label>
            <select
              {...register('artistId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select Artist</option>
              {artists.map(artist => (
                <option key={artist.id} value={artist.id}>{artist.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent/Promoter
            </label>
            <select
              {...register('agentId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Select Agent</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue Capacity *
          </label>
          <input
            type="number"
            {...register('venueCapacity', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
          {errors.venueCapacity && (
            <p className="text-red-500 text-xs mt-1">{errors.venueCapacity.message}</p>
          )}
        </div>
      </Section>

      {/* Section 2: Attendance & Sales Timeline */}
      <Section
        title="Attendance & Sales Timeline"
        index={1}
        expanded={expandedSections.has(1)}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tickets Sold *
            </label>
            <input
              type="number"
              {...register('ticketsSold', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            {errors.ticketsSold && (
              <p className="text-red-500 text-xs mt-1">{errors.ticketsSold.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comp Tickets
            </label>
            <input
              type="number"
              {...register('compTickets', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacity Utilization
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              {capacityUtilization.toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sales Timeline Breakdown
          </label>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">30+ Days Out</label>
              <input
                type="number"
                {...register('advanceSales30Plus', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">7-30 Days Out</label>
              <input
                type="number"
                {...register('advanceSales7to30', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Week of Show</label>
              <input
                type="number"
                {...register('advanceSalesWeekOf', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Day of Show</label>
              <input
                type="number"
                {...register('advanceSalesDayOf', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Door/Walk-up</label>
              <input
                type="number"
                {...register('doorSales', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          {errors.advanceSales30Plus && (
            <p className="text-red-500 text-xs mt-1">{errors.advanceSales30Plus.message}</p>
          )}
        </div>
      </Section>

      {/* Section 3: Ticket Levels */}
      <Section
        title="Ticket Levels"
        index={2}
        expanded={expandedSections.has(2)}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          {ticketLevelFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tier Name</label>
                <input
                  type="text"
                  {...register(`ticketLevels.${index}.tierName`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`ticketLevels.${index}.price`, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Qty Available</label>
                <input
                  type="number"
                  {...register(`ticketLevels.${index}.quantityAvailable`, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Qty Sold</label>
                <input
                  type="number"
                  {...register(`ticketLevels.${index}.quantitySold`, { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Marketing Channel</label>
                <select
                  {...register(`ticketLevels.${index}.marketingChannel`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select</option>
                  <option value="Venue Website">Venue Website</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Email List">Email List</option>
                  <option value="Partner">Partner</option>
                  <option value="Walk-up">Walk-up</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeTicketLevel(index)}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => appendTicketLevel({ tierName: '', price: 0, quantityAvailable: 0, quantitySold: 0 })}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4" />
            Add Ticket Level
          </button>
          <div className="mt-4 p-4 bg-teal-50 rounded-lg">
            <strong>Gross Ticket Sales: ${grossTicketSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </Section>

      {/* Section 4: Deal Structure */}
      <Section
        title="Deal Structure"
        index={3}
        expanded={expandedSections.has(3)}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type *</label>
            <div className="grid grid-cols-4 gap-4">
              {['Versus', 'Flat Guarantee', 'Percentage', 'Hybrid'].map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    value={type}
                    {...register('dealType')}
                    className="mr-2"
                  />
                  <span className="text-sm">{type}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {watch('dealType') !== 'Percentage' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Artist Guarantee ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('artistGuarantee', { 
                    setValueAs: (v) => v === '' || v === null || isNaN(Number(v)) ? undefined : Number(v)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
            {watch('dealType') !== 'Flat Guarantee' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Percentage Split (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('percentageSplit', { 
                    setValueAs: (v) => v === '' || v === null || isNaN(Number(v)) ? undefined : Number(v)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.percentageSplit && (
                  <p className="text-red-500 text-xs mt-1">{errors.percentageSplit.message}</p>
                )}
              </div>
            )}
            {watch('dealType') === 'Hybrid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Door Split Point ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register('hybridDoorSplitPoint', { 
                    setValueAs: (v) => v === '' || v === null || isNaN(Number(v)) ? undefined : Number(v)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {errors.hybridDoorSplitPoint && (
                  <p className="text-red-500 text-xs mt-1">{errors.hybridDoorSplitPoint.message}</p>
                )}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Merch Split Type</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    value="Percentage" 
                    {...register('merchSplitType')} 
                    defaultChecked
                    className="mr-2" 
                  />
                  <span className="text-sm">Percentage</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    value="Flat Fee" 
                    {...register('merchSplitType')} 
                    className="mr-2" 
                  />
                  <span className="text-sm">Flat Fee</span>
                </label>
              </div>
              {errors.merchSplitType && (
                <p className="text-red-500 text-xs mt-1">{errors.merchSplitType.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Merch Split Value ({watch('merchSplitType') === 'Percentage' ? '%' : '$'})
              </label>
              <input
                type="number"
                step="0.01"
                {...register('merchSplitValue', { 
                  setValueAs: (v) => {
                    const num = Number(v);
                    return isNaN(num) || v === '' ? 0 : num;
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.merchSplitValue && (
                <p className="text-red-500 text-xs mt-1">{errors.merchSplitValue.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Production Costs ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('productionCosts', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Section 5: Revenue Streams */}
      <Section
        title="Revenue Streams"
        index={4}
        expanded={expandedSections.has(4)}
        onToggle={toggleSection}
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Ticketing Revenue</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gross Ticket Sales</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  ${grossTicketSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Facility Fees (kept by venue)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('facilityFeesKept', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ticketing Fees (paid to platform)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('ticketingFeesPaidToPlatform', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Taxes</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('taxes', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Ancillary Revenue</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">F&B Sales *</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('fbSales', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total Merch Sales</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('totalMerchSales', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Parking Revenue</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('parkingRevenue', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Other Revenue</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('otherRevenue', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 6: Operating Expenses */}
      <Section
        title="Operating Expenses"
        index={5}
        expanded={expandedSections.has(5)}
        onToggle={toggleSection}
      >
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Labor Costs</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bartender Hours</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('bartenderHours', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Bartender Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('bartenderRate', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  ${((watch('bartenderHours') || 0) * (watch('bartenderRate') || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Security Hours</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('securityHours', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Security Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('securityRate', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Total</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                  ${((watch('securityHours') || 0) * (watch('securityRate') || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Sound/Lighting Tech ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('soundLightingTech', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Door/Box Office Hours</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('doorBoxOfficeHours', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Door/Box Office Rate ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('doorBoxOfficeRate', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Variable Costs</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">F&B Cost of Goods ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('fbCostOfGoods', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Credit Card Fees ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('creditCardFees', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Ticket Platform Fees ($)</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('ticketPlatformFees', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Custom Expenses</h4>
            <div className="space-y-2">
              {customExpenseFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Expense Name"
                    {...register(`customExpenses.${index}.expenseName`)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount"
                    {...register(`customExpenses.${index}.expenseAmount`, { valueAsNumber: true })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Category (optional)"
                    {...register(`customExpenses.${index}.category`)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeCustomExpense(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendCustomExpense({ expenseName: '', expenseAmount: 0, category: '' })}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Custom Expense
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* Section 7: Marketing Investment */}
      <Section
        title="Marketing Investment"
        index={6}
        expanded={expandedSections.has(6)}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Marketing Spend ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('marketingSpend', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Social Media Ads ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('socialMediaAds', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email Marketing ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('emailMarketing', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Print/Radio/Other ($)</label>
              <input
                type="number"
                step="0.01"
                {...register('printRadioOther', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Reach (impressions)
              </label>
              <input
                type="number"
                {...register('estimatedReach', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Customers Acquired
              </label>
              <input
                type="number"
                {...register('newCustomersAcquired', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Section 8: Calculated Performance Summary */}
      <Section
        title="Performance Summary (Auto-Calculated)"
        index={7}
        expanded={expandedSections.has(7)}
        onToggle={toggleSection}
      >
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Financial Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Expenses:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Artist Payout:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Net Event Income:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Profit Margin:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 mb-3">Efficiency Metrics</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Capacity Utilization:</span>
                <span className="font-medium">{capacityUtilization.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue per Cap:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">F&B per Cap:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Merch per Cap:</span>
                <span className="font-medium">Calculated on save</span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500 italic">
          * All calculated fields are computed server-side when you save the form
        </p>
      </Section>

      {/* Section 9: Post-Event Notes */}
      <Section
        title="Post-Event Notes"
        index={8}
        expanded={expandedSections.has(8)}
        onToggle={toggleSection}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What Worked Well?
            </label>
            <textarea
              {...register('whatWorkedWell')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What Didn't Work?
            </label>
            <textarea
              {...register('whatDidntWork')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Book This Artist Again?
            </label>
            <div className="flex gap-4">
              {['Yes', 'Maybe', 'No'].map((option) => (
                <label key={option} className="flex items-center">
                  <input
                    type="radio"
                    value={option}
                    {...register('bookAgain', {
                      setValueAs: (v) => v === '' ? undefined : v
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
            {errors.bookAgain && (
              <p className="text-red-500 text-xs mt-1">{errors.bookAgain.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes on Re-booking
            </label>
            <textarea
              {...register('bookAgainNotes')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agent/Promoter Rating (1-5 stars)
            </label>
            <select
              {...register('agentRating', { 
                setValueAs: (v) => v === '' ? undefined : Number(v)
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select rating</option>
              {[1, 2, 3, 4, 5].map(rating => (
                <option key={rating} value={rating}>{rating} {rating === 1 ? 'star' : 'stars'}</option>
              ))}
            </select>
            {errors.agentRating && (
              <p className="text-red-500 text-xs mt-1">{errors.agentRating.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audience Behavior Notes
            </label>
            <textarea
              {...register('audienceNotes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Section>
      
      {/* Form Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save & Close'}
        </button>
      </div>
    </form>
  );
}

// Section component
function Section({
  title,
  index,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  index: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
      >
        <h3 className="text-lg font-semibold text-brown-800">{title}</h3>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {expanded && <div className="px-6 py-4 border-t border-gray-200">{children}</div>}
    </div>
  );
}

