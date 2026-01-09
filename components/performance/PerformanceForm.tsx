'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, ChevronUp, Save, X, Plus, Trash2, FileText, HelpCircle, Pencil, Edit } from 'lucide-react';

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

const customRevenueStreamSchema = z.object({
  streamName: z.string().min(1, 'Revenue stream name is required'),
  amount: z.number().min(0, 'Amount must be >= 0'),
  category: z.string().optional(),
});

const customMarketingInvestmentSchema = z.object({
  investmentName: z.string().min(1, 'Marketing investment name is required'),
  amount: z.number().min(0, 'Amount must be >= 0'),
  category: z.string().optional(),
  estimatedReach: z.number().min(0).optional(),
  newCustomersAcquired: z.number().min(0).optional(),
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
  
  // Ticket Sales
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
  
  // Revenue Streams (custom - ticket sales are calculated from ticket levels)
  customRevenueStreams: z.array(customRevenueStreamSchema).default([]),
  
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
  
  // Marketing Investment (custom - dynamic array)
  customMarketingInvestments: z.array(customMarketingInvestmentSchema).default([]),
  
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
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; isDefault: boolean; ticketLevels?: any[]; customExpenses?: any[]; customRevenueStreams?: any[]; customMarketingInvestments?: any[] }>>([]);
  
  // Filtered template arrays for each section
  const ticketSalesTemplates = templates.filter(t => t.ticketLevels && t.ticketLevels.length > 0);
  const expensesTemplates = templates.filter(t => t.customExpenses && t.customExpenses.length > 0);
  const revenueStreamsTemplates = templates.filter(t => t.customRevenueStreams && t.customRevenueStreams.length > 0);
  const marketingTemplates = templates.filter(t => t.customMarketingInvestments && t.customMarketingInvestments.length > 0);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null); // Track which template was applied
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  
  // Section-specific template states
  const [selectedExpensesTemplateId, setSelectedExpensesTemplateId] = useState<string | null>(null);
  const [selectedRevenueStreamsTemplateId, setSelectedRevenueStreamsTemplateId] = useState<string | null>(null);
  const [selectedMarketingTemplateId, setSelectedMarketingTemplateId] = useState<string | null>(null);
  
  // Section-specific save template modals
  const [showSaveExpensesTemplateModal, setShowSaveExpensesTemplateModal] = useState(false);
  const [showSaveRevenueStreamsTemplateModal, setShowSaveRevenueStreamsTemplateModal] = useState(false);
  const [showSaveMarketingTemplateModal, setShowSaveMarketingTemplateModal] = useState(false);
  
  const [newExpensesTemplateName, setNewExpensesTemplateName] = useState('');
  const [newRevenueStreamsTemplateName, setNewRevenueStreamsTemplateName] = useState('');
  const [newMarketingTemplateName, setNewMarketingTemplateName] = useState('');
  
  // Template editing states
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editTemplateData, setEditTemplateData] = useState<{
    name: string;
    description: string;
    ticketLevels: any[];
    customExpenses: any[];
    customRevenueStreams: any[];
    customMarketingInvestments: any[];
    isDefault: boolean;
  } | null>(null);

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
      customRevenueStreams: [],
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
      customMarketingInvestments: [],
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

  const { fields: customRevenueStreamFields, append: appendCustomRevenueStream, remove: removeCustomRevenueStream } = useFieldArray({
    control,
    name: 'customRevenueStreams',
  });

  const { fields: customMarketingInvestmentFields, append: appendCustomMarketingInvestment, remove: removeCustomMarketingInvestment } = useFieldArray({
    control,
    name: 'customMarketingInvestments',
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

  // Load contacts, venue data, calendar events, and templates
  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsRes, venueRes, eventsRes, templatesRes] = await Promise.all([
          fetch('/api/contacts'),
          fetch('/api/venue/current'),
          fetch('/api/events'),
          fetch('/api/performance-templates'),
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

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json();
          setTemplates(templatesData);
          
          // Auto-apply default template if creating new performance (not editing)
          if (!eventId && templatesData.length > 0) {
            const defaultTemplate = templatesData.find((t: any) => t.isDefault);
            if (defaultTemplate) {
              applyTemplate(defaultTemplate.id);
              setSelectedTemplateId(defaultTemplate.id);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [setValue, eventId]);

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
              // Convert old revenue fields to custom revenue streams for backward compatibility
              customRevenueStreams: (() => {
                const streams: any[] = [];
                // Check if there are existing custom revenue streams
                if (data.customRevenueStreams && Array.isArray(data.customRevenueStreams)) {
                  return data.customRevenueStreams.map((rs: any) => ({
                    streamName: rs.streamName || rs.name || '',
                    amount: rs.amount || 0,
                    category: rs.category || '',
                  }));
                }
                // Otherwise, convert old fields to custom streams
                if (data.fbsalesTotal || data.fbSales) {
                  streams.push({ streamName: 'F&B Sales', amount: data.fbsalesTotal || data.fbSales || 0, category: 'Food & Beverage' });
                }
                if (data.merchSalesTotal) {
                  streams.push({ streamName: 'Merchandise Sales', amount: data.merchSalesTotal || 0, category: 'Merchandise' });
                }
                if (data.parkingRevenue) {
                  streams.push({ streamName: 'Parking Revenue', amount: data.parkingRevenue || 0, category: 'Parking' });
                }
                if (data.otherRevenue) {
                  streams.push({ streamName: 'Other Revenue', amount: data.otherRevenue || 0, category: 'Other' });
                }
                if (data.facilityFeesKept || data.facilityFees) {
                  streams.push({ streamName: 'Facility Fees', amount: data.facilityFeesKept || data.facilityFees || 0, category: 'Fees' });
                }
                return streams;
              })(),
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

  // Apply template to form
  const applyTemplate = async (templateId: string, showWarning: boolean = true) => {
    try {
      // Check if there's existing data and warn user
      const currentTicketLevels = watch('ticketLevels') || [];
      const currentExpenses = watch('customExpenses') || [];
      const currentRevenueStreams = watch('customRevenueStreams') || [];
      const currentMarketingSpend = watch('marketingSpend') || 0;
      
      if (showWarning && (currentTicketLevels.length > 0 || currentExpenses.length > 0 || currentRevenueStreams.length > 0 || currentMarketingSpend > 0)) {
        const confirmed = window.confirm(
          'Applying a template will replace your current ticket sales, expenses, revenue streams, and marketing investment. ' +
          'You can still edit all values after applying. Continue?'
        );
        if (!confirmed) {
          return;
        }
      }

      const res = await fetch(`/api/performance-templates/${templateId}`);
      if (!res.ok) {
        throw new Error('Failed to load template');
      }
      const template = await res.json();
      
      // Populate ticket levels - these are starting values that can be edited
      if (template.ticketLevels && template.ticketLevels.length > 0) {
        const ticketLevelsData = template.ticketLevels.map((tl: any) => ({
          tierName: tl.tierName,
          price: tl.price, // Starting price - can be changed per event
          quantityAvailable: tl.quantityAvailable || 0, // Starting quantity - can be changed per event
          quantitySold: 0, // Always start at 0 for new events
          marketingChannel: tl.marketingChannel || '',
        }));
        setValue('ticketLevels', ticketLevelsData, { shouldValidate: false });
      }
      
      // Populate custom expenses - these are starting values that can be edited
      if (template.customExpenses && template.customExpenses.length > 0) {
        const customExpensesData = template.customExpenses.map((ce: any) => ({
          expenseName: ce.expenseName,
          expenseAmount: ce.expenseAmount || 0, // Starting amount - can be changed per event
          category: ce.category || '',
        }));
        setValue('customExpenses', customExpensesData, { shouldValidate: false });
      } else {
        setValue('customExpenses', [], { shouldValidate: false });
      }
      
      // Populate custom revenue streams - these are starting values that can be edited
      if (template.customRevenueStreams && template.customRevenueStreams.length > 0) {
        const customRevenueStreamsData = template.customRevenueStreams.map((rs: any) => ({
          streamName: rs.streamName,
          amount: rs.amount || 0, // Starting amount - can be changed per event
          category: rs.category || '',
        }));
        setValue('customRevenueStreams', customRevenueStreamsData, { shouldValidate: false });
      } else {
        setValue('customRevenueStreams', [], { shouldValidate: false });
      }
      
      // Populate custom marketing investments - these are starting values that can be edited
      if (template.customMarketingInvestments && template.customMarketingInvestments.length > 0) {
        const customMarketingInvestmentsData = template.customMarketingInvestments.map((mi: any) => ({
          investmentName: mi.investmentName,
          amount: mi.amount || 0, // Starting amount - can be changed per event
          category: mi.category || '',
          estimatedReach: mi.estimatedReach || 0,
          newCustomersAcquired: mi.newCustomersAcquired || 0,
        }));
        setValue('customMarketingInvestments', customMarketingInvestmentsData, { shouldValidate: false });
      } else {
        setValue('customMarketingInvestments', [], { shouldValidate: false });
      }
      
      // Apply other default values if stored
      if (template.defaultValues) {
        Object.entries(template.defaultValues).forEach(([key, value]) => {
          try {
            setValue(key as any, value, { shouldValidate: false });
          } catch (e) {
            // Ignore invalid keys
          }
        });
      }

      // Track which template was applied so we can reset later
      setAppliedTemplateId(templateId);
    } catch (error) {
      console.error('Error applying template:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  // Reset to the applied template
  const resetToTemplate = () => {
    if (appliedTemplateId) {
      applyTemplate(appliedTemplateId, false);
    }
  };

  // Apply section-specific templates
  const applyExpensesTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/performance-templates/${templateId}`);
      if (!res.ok) throw new Error('Failed to load template');
      const template = await res.json();
      
      if (template.customExpenses && template.customExpenses.length > 0) {
        const customExpensesData = template.customExpenses.map((ce: any) => ({
          expenseName: ce.expenseName,
          expenseAmount: ce.expenseAmount || 0,
          category: ce.category || '',
        }));
        setValue('customExpenses', customExpensesData, { shouldValidate: false });
      } else {
        setValue('customExpenses', [], { shouldValidate: false });
      }
    } catch (error) {
      console.error('Error applying expenses template:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  const applyRevenueStreamsTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/performance-templates/${templateId}`);
      if (!res.ok) throw new Error('Failed to load template');
      const template = await res.json();
      
      if (template.customRevenueStreams && template.customRevenueStreams.length > 0) {
        const customRevenueStreamsData = template.customRevenueStreams.map((rs: any) => ({
          streamName: rs.streamName,
          amount: rs.amount || 0,
          category: rs.category || '',
        }));
        setValue('customRevenueStreams', customRevenueStreamsData, { shouldValidate: false });
      } else {
        setValue('customRevenueStreams', [], { shouldValidate: false });
      }
    } catch (error) {
      console.error('Error applying revenue streams template:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  const applyMarketingTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/performance-templates/${templateId}`);
      if (!res.ok) throw new Error('Failed to load template');
      const template = await res.json();
      
      if (template.customMarketingInvestments && template.customMarketingInvestments.length > 0) {
        const customMarketingInvestmentsData = template.customMarketingInvestments.map((mi: any) => ({
          investmentName: mi.investmentName,
          amount: mi.amount || 0,
          category: mi.category || '',
          estimatedReach: mi.estimatedReach || 0,
          newCustomersAcquired: mi.newCustomersAcquired || 0,
        }));
        setValue('customMarketingInvestments', customMarketingInvestmentsData, { shouldValidate: false });
      } else {
        setValue('customMarketingInvestments', [], { shouldValidate: false });
      }
    } catch (error) {
      console.error('Error applying marketing template:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  // Save current form state as template
  const handleSaveAsTemplate = async () => {
    if (!newTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const formData = watch();
      const templateData = {
        name: newTemplateName.trim(),
        description: newTemplateDescription.trim() || null,
        ticketLevels: Array.isArray(formData.ticketLevels) ? formData.ticketLevels : [],
        customExpenses: Array.isArray(formData.customExpenses) ? formData.customExpenses : [],
        customRevenueStreams: Array.isArray(formData.customRevenueStreams) ? formData.customRevenueStreams : [],
        customMarketingInvestments: Array.isArray(formData.customMarketingInvestments) ? formData.customMarketingInvestments : [],
        defaultValues: {
          // Store commonly used defaults
          bartenderRate: formData.bartenderRate || 0,
          securityRate: formData.securityRate || 0,
          doorBoxOfficeRate: formData.doorBoxOfficeRate || 0,
          dealType: formData.dealType,
          merchSplitType: formData.merchSplitType,
          // Marketing Investment
          marketingSpend: formData.marketingSpend || 0,
          socialMediaAds: formData.socialMediaAds || 0,
          emailMarketing: formData.emailMarketing || 0,
          printRadioOther: formData.printRadioOther || 0,
          estimatedReach: formData.estimatedReach || 0,
          newCustomersAcquired: formData.newCustomersAcquired || 0,
        },
        isDefault: false,
      };

      const res = await fetch('/api/performance-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        let errorData: any = { error: 'Unknown error' };
        try {
          const text = await res.text();
          if (text) {
            try {
              errorData = JSON.parse(text);
            } catch (parseError) {
              errorData = { error: text || `Server error: ${res.status} ${res.statusText}` };
            }
          } else {
            errorData = { error: `Server error: ${res.status} ${res.statusText}` };
          }
        } catch (e) {
          errorData = { error: `Failed to save template: ${res.status} ${res.statusText}` };
        }
        console.error('API error response:', errorData);
        console.error('Full error object:', JSON.stringify(errorData, null, 2));
        const errorMessage = errorData?.error || errorData?.message || `Failed to save template: ${res.status} ${res.statusText}`;
        throw new Error(errorMessage);
      }

      const newTemplate = await res.json();
      setTemplates([...templates, newTemplate]);
      setShowSaveTemplateModal(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template. Please try again.';
      alert(errorMessage);
    }
  };

  // Section-specific template save functions
  const handleSaveExpensesAsTemplate = async () => {
    if (!newExpensesTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const formData = watch();
      const templateData = {
        name: newExpensesTemplateName.trim(),
        description: null,
        ticketLevels: [],
        customExpenses: formData.customExpenses || [],
        customRevenueStreams: [],
        customMarketingInvestments: [],
        defaultValues: {},
        isDefault: false,
      };

      const res = await fetch('/api/performance-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to save template: ${res.status} ${res.statusText}`);
      }

      const newTemplate = await res.json();
      setTemplates([...templates, newTemplate]);
      setShowSaveExpensesTemplateModal(false);
      setNewExpensesTemplateName('');
      alert('Expenses template saved successfully!');
    } catch (error) {
      console.error('Error saving expenses template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template. Please try again.';
      alert(errorMessage);
    }
  };

  const handleSaveRevenueStreamsAsTemplate = async () => {
    if (!newRevenueStreamsTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const formData = watch();
      const templateData = {
        name: newRevenueStreamsTemplateName.trim(),
        description: null,
        ticketLevels: [],
        customExpenses: [],
        customRevenueStreams: formData.customRevenueStreams || [],
        customMarketingInvestments: [],
        defaultValues: {},
        isDefault: false,
      };

      const res = await fetch('/api/performance-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to save template: ${res.status} ${res.statusText}`);
      }

      const newTemplate = await res.json();
      setTemplates([...templates, newTemplate]);
      setShowSaveRevenueStreamsTemplateModal(false);
      setNewRevenueStreamsTemplateName('');
      alert('Revenue streams template saved successfully!');
    } catch (error) {
      console.error('Error saving revenue streams template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template. Please try again.';
      alert(errorMessage);
    }
  };

  const handleSaveMarketingAsTemplate = async () => {
    if (!newMarketingTemplateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      const formData = watch();
      const templateData = {
        name: newMarketingTemplateName.trim(),
        description: null,
        ticketLevels: [],
        customExpenses: [],
        customRevenueStreams: [],
        customMarketingInvestments: formData.customMarketingInvestments || [],
        defaultValues: {},
        isDefault: false,
      };

      const res = await fetch('/api/performance-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to save template: ${res.status} ${res.statusText}`);
      }

      const newTemplate = await res.json();
      setTemplates([...templates, newTemplate]);
      setShowSaveMarketingTemplateModal(false);
      setNewMarketingTemplateName('');
      alert('Marketing investment template saved successfully!');
    } catch (error) {
      console.error('Error saving marketing template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save template. Please try again.';
      alert(errorMessage);
    }
  };

  // Load template data for editing
  const handleEditTemplate = async (templateId: string) => {
    try {
      const res = await fetch(`/api/performance-templates/${templateId}`);
      if (!res.ok) {
        throw new Error('Failed to load template');
      }
      const template = await res.json();
      
      setEditTemplateData({
        name: template.name || '',
        description: template.description || '',
        ticketLevels: template.ticketLevels || [],
        customExpenses: template.customExpenses || [],
        customRevenueStreams: template.customRevenueStreams || [],
        customMarketingInvestments: template.customMarketingInvestments || [],
        isDefault: template.isDefault || false,
      });
      setEditingTemplateId(templateId);
      setShowEditTemplateModal(true);
    } catch (error) {
      console.error('Error loading template for editing:', error);
      alert('Failed to load template. Please try again.');
    }
  };

  // Update template
  const handleUpdateTemplate = async (useCurrentFormData: boolean = false) => {
    if (!editingTemplateId || !editTemplateData) {
      return;
    }

    if (!editTemplateData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    try {
      let templateData: any;
      
      if (useCurrentFormData) {
        // Update template with current form data
        const formData = watch();
        templateData = {
          name: editTemplateData.name.trim(),
          description: editTemplateData.description.trim() || null,
          ticketLevels: Array.isArray(formData.ticketLevels) ? formData.ticketLevels : [],
          customExpenses: Array.isArray(formData.customExpenses) ? formData.customExpenses : [],
          customRevenueStreams: Array.isArray(formData.customRevenueStreams) ? formData.customRevenueStreams : [],
          customMarketingInvestments: Array.isArray(formData.customMarketingInvestments) ? formData.customMarketingInvestments : [],
          defaultValues: {},
          isDefault: editTemplateData.isDefault,
        };
      } else {
        // Update template with existing data (only name, description, default status)
        templateData = {
          name: editTemplateData.name.trim(),
          description: editTemplateData.description.trim() || null,
          ticketLevels: editTemplateData.ticketLevels || [],
          customExpenses: editTemplateData.customExpenses || [],
          customRevenueStreams: editTemplateData.customRevenueStreams || [],
          customMarketingInvestments: editTemplateData.customMarketingInvestments || [],
          defaultValues: {},
          isDefault: editTemplateData.isDefault,
        };
      }

      const res = await fetch(`/api/performance-templates/${editingTemplateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error response:', errorData);
        throw new Error(errorData.error || `Failed to update template: ${res.status} ${res.statusText}`);
      }

      const updatedTemplate = await res.json();
      // Update the template in the list
      setTemplates(templates.map(t => t.id === editingTemplateId ? updatedTemplate : t));
      setShowEditTemplateModal(false);
      setEditingTemplateId(null);
      setEditTemplateData(null);
      alert('Template updated successfully!');
    } catch (error) {
      console.error('Error updating template:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update template. Please try again.';
      alert(errorMessage);
    }
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
        tooltip="Enter the basic information about your event: the date and time it occurred, the artist or event name, genre, and your venue's capacity. This information helps identify and categorize the event in your records. You can also link it to an existing artist or agent/promoter from your contacts."
        tooltipId="section-event-basics"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
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
        tooltip="Track how many tickets were sold and when they were purchased. Enter the total tickets sold and any complimentary (free) tickets. The sales timeline breakdown shows when tickets were bought relative to the event date (30+ days before, 7-30 days before, week of show, day of show, or at the door). This helps you understand your sales patterns and plan future marketing."
        tooltipId="section-attendance-sales"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
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

      {/* Section 3: Ticket Sales */}
      <Section
        title="Ticket Sales"
        index={2}
        expanded={expandedSections.has(2)}
        onToggle={toggleSection}
        tooltip="Set up your ticket pricing tiers (like General Admission, VIP, Early Bird, etc.). For each tier, enter the price, how many tickets were available, how many were sold, and which marketing channel sold them. This automatically calculates your total ticket revenue. You can save these ticket configurations as templates to reuse for similar events."
        tooltipId="section-ticket-sales"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
      >
        <div className="space-y-4">
          {/* Template selector */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Load from Template:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTemplateId || ''}
                      onChange={(e) => {
                        const templateId = e.target.value;
                        if (templateId) {
                          applyTemplate(templateId);
                          setSelectedTemplateId(templateId);
                        } else {
                          setSelectedTemplateId(null);
                          setAppliedTemplateId(null);
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                      title="Choose a saved template to automatically fill in ticket sales, expenses, revenue streams, and marketing investment"
                    >
                      <option value="">Select a template...</option>
                      {ticketSalesTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.isDefault ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedTemplateId && (
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(selectedTemplateId)}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit this template"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {appliedTemplateId && (
                    <div className="relative inline-block overflow-visible">
                      <button
                        type="button"
                        onClick={resetToTemplate}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        onMouseEnter={() => setHoveredTooltip('reset-template')}
                        onMouseLeave={() => setHoveredTooltip(null)}
                      >
                        <X className="w-4 h-4" />
                        Reset to Template
                      </button>
                      {hoveredTooltip === 'reset-template' && (
                        <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                          <div className="font-semibold mb-1">Reset to Template</div>
                          <div className="text-gray-200">
                            This will restore all ticket sales, expenses, revenue streams, and marketing investment back to the template values, replacing any changes you've made.
                          </div>
                          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSaveTemplateModal(true)}
                    className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Save Current as Template
                  </button>
                </div>
              </div>
              {appliedTemplateId && (
                <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                  <strong>Template Applied:</strong> You can edit all prices, quantities, ticket sales, expenses, revenue streams, and marketing investment below. 
                  These are starting values that you can customize for this specific event. 
                  Changes here won't affect the template.
                </div>
              )}
              {templates.length === 0 && (
                <div className="text-xs text-gray-600 bg-gray-100 p-2 rounded">
                  <strong>No templates yet.</strong> Create your first template by setting up ticket sales, expenses, revenue streams, and marketing investment, then click "Save Current as Template" above. 
                  Templates save you time by letting you reuse common configurations.
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="mb-1">
              <strong>Getting Started:</strong> You can either select a template above to quickly load saved ticket levels, or create ticket levels manually below. 
              After setting up your ticket levels, you can save them as a template using the "Save Current as Template" button above for future events.
            </p>
          </div>

          {/* Save Template Modal */}
          {showSaveTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Save as Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="e.g., Standard Show, VIP Event"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="Brief description of this template..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    This will save your current ticket sales, expenses, revenue streams, and marketing investment.
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveTemplateModal(false);
                      setNewTemplateName('');
                      setNewTemplateDescription('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAsTemplate}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section-specific template save modals */}
          {showSaveExpensesTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Expenses as Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newExpensesTemplateName}
                      onChange={(e) => setNewExpensesTemplateName(e.target.value)}
                      placeholder="e.g., Standard Expenses"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    This will save your current custom expenses as a template.
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveExpensesTemplateModal(false);
                      setNewExpensesTemplateName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveExpensesAsTemplate}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSaveRevenueStreamsTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Revenue Streams as Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newRevenueStreamsTemplateName}
                      onChange={(e) => setNewRevenueStreamsTemplateName(e.target.value)}
                      placeholder="e.g., Standard Revenue Streams"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    This will save your current revenue streams as a template.
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveRevenueStreamsTemplateModal(false);
                      setNewRevenueStreamsTemplateName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRevenueStreamsAsTemplate}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSaveMarketingTemplateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Save Marketing Investment as Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={newMarketingTemplateName}
                      onChange={(e) => setNewMarketingTemplateName(e.target.value)}
                      placeholder="e.g., Standard Marketing"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    This will save your current marketing investments as a template.
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSaveMarketingTemplateModal(false);
                      setNewMarketingTemplateName('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveMarketingAsTemplate}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Template Modal */}
          {showEditTemplateModal && editTemplateData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Template</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={editTemplateData.name}
                      onChange={(e) => setEditTemplateData({ ...editTemplateData, name: e.target.value })}
                      placeholder="e.g., Standard Show, VIP Event"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={editTemplateData.description}
                      onChange={(e) => setEditTemplateData({ ...editTemplateData, description: e.target.value })}
                      placeholder="Brief description of this template..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="editTemplateDefault"
                      checked={editTemplateData.isDefault}
                      onChange={(e) => setEditTemplateData({ ...editTemplateData, isDefault: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    <label htmlFor="editTemplateDefault" className="text-sm text-gray-700">
                      Set as default template
                    </label>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Template Contents:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {editTemplateData.ticketLevels && editTemplateData.ticketLevels.length > 0 && (
                        <li>{editTemplateData.ticketLevels.length} ticket level(s)</li>
                      )}
                      {editTemplateData.customExpenses && editTemplateData.customExpenses.length > 0 && (
                        <li>{editTemplateData.customExpenses.length} expense(s)</li>
                      )}
                      {editTemplateData.customRevenueStreams && editTemplateData.customRevenueStreams.length > 0 && (
                        <li>{editTemplateData.customRevenueStreams.length} revenue stream(s)</li>
                      )}
                      {editTemplateData.customMarketingInvestments && editTemplateData.customMarketingInvestments.length > 0 && (
                        <li>{editTemplateData.customMarketingInvestments.length} marketing investment(s)</li>
                      )}
                      {(!editTemplateData.ticketLevels || editTemplateData.ticketLevels.length === 0) &&
                       (!editTemplateData.customExpenses || editTemplateData.customExpenses.length === 0) &&
                       (!editTemplateData.customRevenueStreams || editTemplateData.customRevenueStreams.length === 0) &&
                       (!editTemplateData.customMarketingInvestments || editTemplateData.customMarketingInvestments.length === 0) && (
                        <li className="text-gray-400">No content in this template</li>
                      )}
                    </ul>
                    <p className="mt-2">You can edit the template name, description, and default status. To update the template contents, use the "Update with Current Form Data" button below.</p>
                  </div>
                </div>
                <div className="flex justify-between gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditTemplateModal(false);
                      setEditingTemplateId(null);
                      setEditTemplateData(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateTemplate(false)}
                      className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg hover:bg-teal-50"
                    >
                      Update Name/Description Only
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTemplate(true)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                      Update with Current Form Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {ticketLevelFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-6 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1 overflow-visible">
                  Tier Name
                  <div 
                    className="relative inline-block overflow-visible"
                    onMouseEnter={() => setHoveredTooltip(`tierName-${index}`)}
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    <HelpCircle 
                      className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-teal-600 transition-colors" 
                    />
                    {hoveredTooltip === `tierName-${index}` && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                        <div className="font-semibold mb-1">Tier Name</div>
                        <div className="text-gray-200">The name of this ticket type (e.g., "General Admission", "VIP", "Early Bird"). This helps you identify different ticket options for your event.</div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="text"
                  {...register(`ticketLevels.${index}.tierName`)}
                  placeholder="e.g., GA, VIP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1 overflow-visible">
                  Price ($)
                  <div 
                    className="relative inline-block overflow-visible"
                    onMouseEnter={() => setHoveredTooltip(`price-${index}`)}
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    <HelpCircle 
                      className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-teal-600 transition-colors" 
                    />
                    {hoveredTooltip === `price-${index}` && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                        <div className="font-semibold mb-1">Price</div>
                        <div className="text-gray-200">The price customers pay for this ticket level. Enter the amount in dollars (e.g., 25.00 for $25 tickets). You can change this from the template value for each event.</div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register(`ticketLevels.${index}.price`, { valueAsNumber: true })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1 overflow-visible">
                  Qty Available
                  <div 
                    className="relative inline-block overflow-visible"
                    onMouseEnter={() => setHoveredTooltip(`qtyAvailable-${index}`)}
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    <HelpCircle 
                      className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-teal-600 transition-colors" 
                    />
                    {hoveredTooltip === `qtyAvailable-${index}` && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                        <div className="font-semibold mb-1">Quantity Available</div>
                        <div className="text-gray-200">How many tickets of this type you're selling. This is the total number available, not how many were sold. Leave blank if unlimited. You can change this from the template value for each event.</div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="number"
                  {...register(`ticketLevels.${index}.quantityAvailable`, { valueAsNumber: true })}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1 overflow-visible">
                  Qty Sold
                  <div 
                    className="relative inline-block overflow-visible"
                    onMouseEnter={() => setHoveredTooltip(`qtySold-${index}`)}
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    <HelpCircle 
                      className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-teal-600 transition-colors" 
                    />
                    {hoveredTooltip === `qtySold-${index}` && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                        <div className="font-semibold mb-1">Quantity Sold</div>
                        <div className="text-gray-200">How many tickets of this type were actually sold. Enter 0 if no tickets were sold yet. This is used to calculate your total revenue.</div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </label>
                <input
                  type="number"
                  {...register(`ticketLevels.${index}.quantitySold`, { valueAsNumber: true })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1 overflow-visible">
                  Marketing Channel
                  <div 
                    className="relative inline-block overflow-visible"
                    onMouseEnter={() => setHoveredTooltip(`marketingChannel-${index}`)}
                    onMouseLeave={() => setHoveredTooltip(null)}
                  >
                    <HelpCircle 
                      className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-teal-600 transition-colors" 
                    />
                    {hoveredTooltip === `marketingChannel-${index}` && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                        <div className="font-semibold mb-1">Marketing Channel</div>
                        <div className="text-gray-200">Where customers found out about this ticket level. This helps you track which marketing efforts are working best (optional).</div>
                        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </div>
                </label>
                <select
                  {...register(`ticketLevels.${index}.marketingChannel`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">Select (optional)</option>
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
                  title="Remove this ticket level"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => appendTicketLevel({ tierName: '', price: 0, quantityAvailable: 0, quantitySold: 0 })}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Ticket Level
            </button>
            <p className="text-xs text-gray-500">
              You can add more ticket levels beyond what's in your template, or remove any level you don't need for this event.
            </p>
          </div>
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
        tooltip="Define how you're paying the artist. Choose from Versus (artist gets a percentage after expenses), Flat Guarantee (fixed amount), Percentage (artist gets a percentage of revenue), or Hybrid (combination). Also set merchandise split (how you share merch sales with the artist) and any production costs. This determines how much you pay the artist and affects your profit."
        tooltipId="section-deal-structure"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
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
        tooltip="Record all sources of income beyond ticket sales. This includes food & beverage sales, merchandise, parking fees, sponsorships, or any other revenue. Ticket sales are automatically calculated from your ticket tiers above. Add custom revenue streams to capture all money coming in from the event. This gives you a complete picture of total revenue."
        tooltipId="section-revenue-streams"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
      >
        <div className="space-y-6">
          {/* Ticket Sales (calculated from ticket levels) */}
          <div>
            <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2 overflow-visible">
              Ticket Sales
              <div 
                className="relative inline-block overflow-visible"
                onMouseEnter={() => setHoveredTooltip('ticket-sales')}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-teal-600 transition-colors" />
                {hoveredTooltip === 'ticket-sales' && (
                  <div className="absolute left-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                    <div className="font-semibold mb-1">Gross Ticket Sales</div>
                    <div className="text-gray-200">This is automatically calculated from your ticket levels above (price × quantity sold). You don't need to enter this manually.</div>
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Gross Ticket Sales (Auto-calculated)</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg font-medium">
                  ${grossTicketSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Template selector for Revenue Streams */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg overflow-visible">
            <div className="space-y-3 overflow-visible">
              <div className="flex items-center justify-between flex-wrap gap-3 overflow-visible">
                <div className="flex items-center gap-3 flex-wrap">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Load from Template:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedRevenueStreamsTemplateId || ''}
                      onChange={(e) => {
                        const templateId = e.target.value;
                        if (templateId) {
                          applyRevenueStreamsTemplate(templateId);
                          setSelectedRevenueStreamsTemplateId(templateId);
                        } else {
                          setSelectedRevenueStreamsTemplateId(null);
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select a template...</option>
                      {revenueStreamsTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.isDefault ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedRevenueStreamsTemplateId && (
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(selectedRevenueStreamsTemplateId)}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit this template"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSaveRevenueStreamsTemplateModal(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Save Current as Template
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
            <p className="mb-1">
              <strong>Getting Started:</strong> You can either select a template above to quickly load saved revenue streams, or create revenue streams manually below. 
              After setting up your revenue streams, you can save them as a template using the "Save Current as Template" button above for future events.
            </p>
          </div>

          {/* Custom Revenue Streams */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700 flex items-center gap-2 overflow-visible">
                Additional Revenue Streams
                <div 
                  className="relative inline-block overflow-visible"
                  onMouseEnter={() => setHoveredTooltip('revenue-streams')}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <HelpCircle className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-teal-600 transition-colors" />
                  {hoveredTooltip === 'revenue-streams' && (
                    <div className="absolute left-0 bottom-full mb-2 z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                      <div className="font-semibold mb-1">Additional Revenue Streams</div>
                      <div className="text-gray-200">Add any revenue sources beyond ticket sales, such as F&B sales, merchandise, parking, sponsorships, or other income. Each revenue stream can have its own name and amount.</div>
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
              </h4>
            </div>
            <div className="space-y-2">
              {customRevenueStreamFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1 overflow-visible">
                      Revenue Stream Name
                      <div 
                        className="relative inline-block overflow-visible"
                        onMouseEnter={() => setHoveredTooltip(`revenue-name-${index}`)}
                        onMouseLeave={() => setHoveredTooltip(null)}
                      >
                        <HelpCircle className="w-3 h-3 text-gray-400 cursor-help hover:text-teal-600 transition-colors" />
                        {hoveredTooltip === `revenue-name-${index}` && (
                          <div className="absolute left-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                            <div className="font-semibold mb-1">Revenue Stream Name</div>
                            <div className="text-gray-200">Name this revenue source (e.g., "F&B Sales", "Merchandise", "Parking", "Sponsorships").</div>
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., F&B Sales, Merchandise"
                      {...register(`customRevenueStreams.${index}.streamName`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 flex items-center gap-1 overflow-visible">
                      Amount ($)
                      <div 
                        className="relative inline-block overflow-visible"
                        onMouseEnter={() => setHoveredTooltip(`revenue-amount-${index}`)}
                        onMouseLeave={() => setHoveredTooltip(null)}
                      >
                        <HelpCircle className="w-3 h-3 text-gray-400 cursor-help hover:text-teal-600 transition-colors" />
                        {hoveredTooltip === `revenue-amount-${index}` && (
                          <div className="absolute left-0 bottom-full mb-2 z-50 w-56 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                            <div className="font-semibold mb-1">Amount</div>
                            <div className="text-gray-200">Enter the total revenue amount for this stream in dollars (e.g., 1250.00 for $1,250).</div>
                            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                          </div>
                        )}
                      </div>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`customRevenueStreams.${index}.amount`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Category (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g., Food & Beverage"
                      {...register(`customRevenueStreams.${index}.category`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeCustomRevenueStream(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove this revenue stream"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendCustomRevenueStream({ streamName: '', amount: 0, category: '' })}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Revenue Stream
              </button>
            </div>
            {/* Total Additional Revenue */}
            <div className="mt-4 p-4 bg-teal-50 rounded-lg">
              <strong>Total Additional Revenue: ${(watch('customRevenueStreams') || []).reduce((sum: number, rs: any) => sum + (rs.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
        tooltip="Track all the costs of running the event. This includes staff costs (bartenders, security, door staff, sound/lighting tech), food & beverage costs, credit card processing fees, ticket platform fees, and any other expenses. Add custom expenses for anything specific to your event. Understanding your expenses helps you see your true profit."
        tooltipId="section-operating-expenses"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
      >
        <div className="space-y-4">
          {/* Template selector for Expenses */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg overflow-visible">
            <div className="space-y-3 overflow-visible">
              <div className="flex items-center justify-between flex-wrap gap-3 overflow-visible">
                <div className="flex items-center gap-3 flex-wrap">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Load from Template:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedExpensesTemplateId || ''}
                      onChange={(e) => {
                        const templateId = e.target.value;
                        if (templateId) {
                          applyExpensesTemplate(templateId);
                          setSelectedExpensesTemplateId(templateId);
                        } else {
                          setSelectedExpensesTemplateId(null);
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select a template...</option>
                      {expensesTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.isDefault ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedExpensesTemplateId && (
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(selectedExpensesTemplateId)}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit this template"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSaveExpensesTemplateModal(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Save Current as Template
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
            <p className="mb-1">
              <strong>Getting Started:</strong> You can either select a template above to quickly load saved expenses, or create custom expenses manually below. 
              After setting up your expenses, you can save them as a template using the "Save Current as Template" button above for future events.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700">Custom Expenses</h4>
              <p className="text-xs text-gray-500">Edit amounts or add/remove expenses as needed</p>
            </div>
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
            {/* Total Expenses */}
            <div className="mt-4 p-4 bg-teal-50 rounded-lg">
              <strong>Total Expenses: ${(watch('customExpenses') || []).reduce((sum: number, exp: any) => sum + (exp.expenseAmount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
        tooltip="Record how much you spent on marketing and advertising for this event. This includes social media ads, print ads, radio spots, flyers, email campaigns, or any other promotional activities. You can also track how many people each marketing effort reached and how many new customers it brought in. This helps you understand which marketing strategies work best."
        tooltipId="section-marketing-investment"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
      >
        <div className="space-y-4">
          {/* Template selector for Marketing Investment */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg overflow-visible">
            <div className="space-y-3 overflow-visible">
              <div className="flex items-center justify-between flex-wrap gap-3 overflow-visible">
                <div className="flex items-center gap-3 flex-wrap">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <label className="text-sm font-medium text-gray-700">
                    Load from Template:
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedMarketingTemplateId || ''}
                      onChange={(e) => {
                        const templateId = e.target.value;
                        if (templateId) {
                          applyMarketingTemplate(templateId);
                          setSelectedMarketingTemplateId(templateId);
                        } else {
                          setSelectedMarketingTemplateId(null);
                        }
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Select a template...</option>
                      {marketingTemplates.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.isDefault ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>
                    {selectedMarketingTemplateId && (
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(selectedMarketingTemplateId)}
                        className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                        title="Edit this template"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSaveMarketingTemplateModal(true)}
                  className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Save Current as Template
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
            <p className="mb-1">
              <strong>Getting Started:</strong> You can either select a template above to quickly load saved marketing investments, or create marketing investments manually below. 
              After setting up your marketing investments, you can save them as a template using the "Save Current as Template" button above for future events.
            </p>
          </div>

          {/* Custom Marketing Investments */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-700">Marketing Investments</h4>
              <p className="text-xs text-gray-500">Add or remove marketing investments as needed</p>
            </div>
            <div className="space-y-2">
              {customMarketingInvestmentFields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-6 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Investment Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Social Media Ads"
                      {...register(`customMarketingInvestments.${index}.investmentName`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Amount ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`customMarketingInvestments.${index}.amount`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g., Digital"
                      {...register(`customMarketingInvestments.${index}.category`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Estimated Reach</label>
                    <input
                      type="number"
                      placeholder="0"
                      {...register(`customMarketingInvestments.${index}.estimatedReach`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">New Customers</label>
                    <input
                      type="number"
                      placeholder="0"
                      {...register(`customMarketingInvestments.${index}.newCustomersAcquired`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeCustomMarketingInvestment(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove this marketing investment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => appendCustomMarketingInvestment({ investmentName: '', amount: 0, category: '', estimatedReach: 0, newCustomersAcquired: 0 })}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <Plus className="w-4 h-4" />
                Add Marketing Investment
              </button>
            </div>
            {/* Total Marketing Investment */}
            <div className="mt-4 p-4 bg-teal-50 rounded-lg">
              <strong>Total Marketing Investment: ${(watch('customMarketingInvestments') || []).reduce((sum: number, mi: any) => sum + (mi.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
        tooltip="This section shows automatically calculated metrics that summarize your event's financial performance. It includes total revenue, expenses, artist payout, net income (profit), profit margin, and efficiency metrics like revenue per attendee. These numbers are calculated when you save the form, giving you a complete financial picture of the event."
        tooltipId="section-performance-summary"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
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
        tooltip="Capture your thoughts and observations after the event. Note what worked well, what didn't, whether you'd book this artist again, and rate your experience with the agent or promoter. Also record any notes about audience behavior. These notes help you make better booking decisions in the future and remember important details about each event."
        tooltipId="section-post-event-notes"
        onTooltipHover={setHoveredTooltip}
        hoveredTooltip={hoveredTooltip}
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
  tooltip,
  tooltipId,
  onTooltipHover,
  hoveredTooltip,
}: {
  title: string;
  index: number;
  expanded: boolean;
  onToggle: (index: number) => void;
  children: React.ReactNode;
  tooltip?: string;
  tooltipId?: string;
  onTooltipHover?: (id: string | null) => void;
  hoveredTooltip?: string | null;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-2 overflow-visible">
          <h3 className="text-lg font-semibold text-brown-800">{title}</h3>
          {tooltip && tooltipId && onTooltipHover && (
            <div 
              className="relative inline-block overflow-visible"
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => onTooltipHover(tooltipId)}
              onMouseLeave={() => onTooltipHover(null)}
            >
              <HelpCircle className="w-4 h-4 text-gray-400 cursor-help hover:text-teal-600 transition-colors" />
              {hoveredTooltip === tooltipId && (
                <div className="absolute left-0 bottom-full mb-2 z-50 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl pointer-events-none">
                  <div className="font-semibold mb-1">{title}</div>
                  <div className="text-gray-200">{tooltip}</div>
                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              )}
            </div>
          )}
        </div>
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

