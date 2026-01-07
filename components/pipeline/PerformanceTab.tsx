'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface PerformanceTabProps {
  opportunity: any;
  onSave?: () => void;
  eventId?: string;
}

export function PerformanceTab({ opportunity, onSave, eventId: providedEventId }: PerformanceTabProps) {
  const [performanceData, setPerformanceData] = useState({
    // Event Basics
    eventDate: '',
    eventTime: '',
    genre: '',
    promoterName: '',
    isRecurringCustomer: false,
    
    // Capacity & Attendance
    capacity: '',
    ticketsSold: '',
    compTickets: '',
    
    // Advance Sales Timeline
    advanceSales30Plus: '',
    advanceSales7to30: '',
    advanceSalesWeekOf: '',
    advanceSalesDayOf: '',
    doorSales: '',
    
    // Deal Information
    dealType: '',
    artistGuarantee: '',
    percentageSplit: '',
    doorPriceSplitPoint: '',
    merchDeal: '',
    merchCommission: '',
    merchCommissionType: 'percentage',
    productionCosts: '',
    productionCostsPaidBy: 'venue',
    
    // Revenue Streams
    facilityFees: '',
    ticketingPlatformFees: '',
    ticketTaxes: '',
    fbsalesTotal: '',
    merchSalesTotal: '',
    parkingRevenue: '',
    coatCheckRevenue: '',
    otherRevenue: '',
    grossReceiptsPotential: '',
    
    // Operating Expenses
    fbcogsPercentage: '',
    fbcogsDollar: '',
    creditCardFees: '',
    rentAllocation: '',
    insuranceAllocation: '',
    utilitiesAllocation: '',
    marketingSpend: '',
    
    // Marketing
    marketingSocialMediaAds: '',
    marketingEmail: '',
    marketingPrintRadio: '',
    marketingPromoter: '',
    marketingEstimatedReach: '',
    newCustomersAcquired: '',
    
    // Post-Event Notes
    whatWorkedWell: '',
    whatDidntWork: '',
    bookAgain: '',
    bookAgainNotes: '',
    promoterRating: '',
    audienceBehaviorNotes: '',
    
    // Legacy fields (for backward compatibility)
    grossReceipts: '',
    taxes: '',
    netReceipts: '',
    artistPayout: '',
    grossProfit: '',
    netEventIncome: '',
    perCapFb: '',
    perCapMerch: '',
    perCapParking: '',
    grossPerCap: '',
  });
  
  const [ticketLevels, setTicketLevels] = useState<Array<{
    level: string;
    price: number;
    quantityAvailable: number;
    quantitySold: number;
    feesKeptByVenue: number;
    marketingChannel: string;
    gross: number;
  }>>([]);
  
  const [laborCosts, setLaborCosts] = useState<Array<{
    role: string;
    hours: number;
    rate: number;
    total: number;
  }>>([]);
  
  const [expenses, setExpenses] = useState<Array<{type: string; amount: number; category: string}>>([]);

  useEffect(() => {
    if (opportunity) {
      // Load performance data if event exists
      if (opportunity.event?.performance) {
        const perf = opportunity.event.performance;
        const ticketPrices = Array.isArray(perf.ticketPrices) ? perf.ticketPrices : [];
        const expensesData = Array.isArray(perf.expenses) ? perf.expenses : [];
        const laborData = Array.isArray(perf.laborCosts) ? perf.laborCosts : [];
        
        // Migrate old ticket level format to new format
        const migratedTicketLevels = ticketPrices.map((tl: any) => ({
          level: tl.level || '',
          price: tl.price || 0,
          quantityAvailable: tl.quantityAvailable || tl.quantity || 0,
          quantitySold: tl.quantitySold || tl.quantity || 0,
          feesKeptByVenue: tl.feesKeptByVenue || 0,
          marketingChannel: tl.marketingChannel || '',
          gross: tl.gross || (tl.price || 0) * (tl.quantitySold || tl.quantity || 0),
        }));
        
        setTicketLevels(migratedTicketLevels);
        setExpenses(expensesData);
        setLaborCosts(laborData);
        
        // Format event date/time
        const eventDate = perf.eventDate ? new Date(perf.eventDate) : null;
        
        setPerformanceData({
          // Event Basics
          eventDate: eventDate ? eventDate.toISOString().split('T')[0] : '',
          eventTime: eventDate ? eventDate.toTimeString().slice(0, 5) : '',
          genre: perf.genre || '',
          promoterName: perf.promoterName || '',
          isRecurringCustomer: perf.isRecurringCustomer || false,
          
          // Capacity & Attendance
          capacity: perf.capacity?.toString() || '',
          ticketsSold: perf.ticketsSold?.toString() || '',
          compTickets: perf.compTickets?.toString() || '',
          
          // Advance Sales Timeline
          advanceSales30Plus: perf.advanceSales30Plus?.toString() || '',
          advanceSales7to30: perf.advanceSales7to30?.toString() || '',
          advanceSalesWeekOf: perf.advanceSalesWeekOf?.toString() || '',
          advanceSalesDayOf: perf.advanceSalesDayOf?.toString() || '',
          doorSales: perf.doorSales?.toString() || '',
          
          // Deal Information
          dealType: perf.dealType || '',
          artistGuarantee: perf.artistGuarantee?.toString() || '',
          percentageSplit: perf.percentageSplit?.toString() || '',
          doorPriceSplitPoint: perf.doorPriceSplitPoint?.toString() || '',
          merchDeal: perf.merchDeal || '',
          merchCommission: perf.merchCommission?.toString() || '',
          merchCommissionType: perf.merchCommissionType || 'percentage',
          productionCosts: perf.productionCosts?.toString() || '',
          productionCostsPaidBy: perf.productionCostsPaidBy || 'venue',
          
          // Revenue Streams
          facilityFees: perf.facilityFees?.toString() || '',
          ticketingPlatformFees: perf.ticketingPlatformFees?.toString() || '',
          ticketTaxes: perf.ticketTaxes?.toString() || perf.taxes?.toString() || '',
          fbsalesTotal: perf.fbsalesTotal?.toString() || '',
          merchSalesTotal: perf.merchSalesTotal?.toString() || '',
          parkingRevenue: perf.parkingRevenue?.toString() || '',
          coatCheckRevenue: perf.coatCheckRevenue?.toString() || '',
          otherRevenue: perf.otherRevenue?.toString() || '',
          grossReceiptsPotential: perf.grossReceiptsPotential?.toString() || '',
          
          // Operating Expenses
          fbcogsPercentage: perf.fbcogsPercentage?.toString() || '',
          fbcogsDollar: perf.fbcogsDollar?.toString() || '',
          creditCardFees: perf.creditCardFees?.toString() || '',
          rentAllocation: perf.rentAllocation?.toString() || '',
          insuranceAllocation: perf.insuranceAllocation?.toString() || '',
          utilitiesAllocation: perf.utilitiesAllocation?.toString() || '',
          marketingSpend: perf.marketingSpend?.toString() || '',
          
          // Marketing (from JSON array or separate fields)
          marketingSocialMediaAds: '',
          marketingEmail: '',
          marketingPrintRadio: '',
          marketingPromoter: '',
          marketingEstimatedReach: perf.marketingChannels?.estimatedReach?.toString() || '',
          newCustomersAcquired: perf.newCustomersAcquired?.toString() || '',
          
          // Post-Event Notes
          whatWorkedWell: perf.whatWorkedWell || '',
          whatDidntWork: perf.whatDidntWork || '',
          bookAgain: perf.bookAgain || '',
          bookAgainNotes: perf.bookAgainNotes || '',
          promoterRating: perf.promoterRating?.toString() || '',
          audienceBehaviorNotes: perf.audienceBehaviorNotes || '',
          
          // Legacy fields
          grossReceipts: perf.grossReceipts?.toString() || '',
          taxes: perf.taxes?.toString() || '',
          netReceipts: perf.netReceipts?.toString() || '',
          artistPayout: perf.artistPayout?.toString() || '',
          grossProfit: perf.grossProfit?.toString() || '',
          netEventIncome: perf.netEventIncome?.toString() || '',
          perCapFb: perf.perCapFb?.toString() || perf.fbRevenuePerCap?.toString() || '',
          perCapMerch: perf.perCapMerch?.toString() || perf.merchRevenuePerCap?.toString() || '',
          perCapParking: perf.perCapParking?.toString() || '',
          grossPerCap: perf.grossPerCap?.toString() || '',
        });
      } else {
        // Pre-fill event date/time from event if available
        if (opportunity.event?.startDate) {
          const eventDate = new Date(opportunity.event.startDate);
          setPerformanceData(prev => ({
            ...prev,
            eventDate: eventDate.toISOString().split('T')[0],
            eventTime: eventDate.toTimeString().slice(0, 5),
          }));
        }
      }
    }
  }, [opportunity]);

  // Calculate total gross receipts from ticket levels
  const calculateTotalGrossReceipts = () => {
    return ticketLevels.reduce((sum, level) => sum + (level.gross || 0), 0);
  };

  // Update ticket level and recalculate gross
  const updateTicketLevel = (index: number, field: string, value: string | number) => {
    const updated = [...ticketLevels];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate gross if price or quantitySold changes
    if (field === 'price' || field === 'quantitySold') {
      const price = field === 'price' ? parseFloat(value as string) || 0 : updated[index].price || 0;
      const quantitySold = field === 'quantitySold' ? parseInt(value as string) || 0 : updated[index].quantitySold || 0;
      updated[index].gross = price * quantitySold;
    }
    
    setTicketLevels(updated);
    
    // Calculate previous total for comparison
    const previousTotal = ticketLevels.reduce((sum, level) => sum + (level.gross || 0), 0);
    
    // Auto-update gross receipts from ticket levels
    const totalGross = updated.reduce((sum, level) => sum + (level.gross || 0), 0);
    setPerformanceData(prev => {
      const currentGross = parseFloat(prev.grossReceipts) || 0;
      const shouldAutoUpdate = !prev.grossReceipts || prev.grossReceipts === '' || 
                               Math.abs(currentGross - previousTotal) < 0.01;
      
      return {
        ...prev,
        grossReceipts: shouldAutoUpdate 
          ? (totalGross > 0 ? totalGross.toString() : '') 
          : prev.grossReceipts,
      };
    });
  };

  // Add new ticket level
  const addTicketLevel = () => {
    setTicketLevels([...ticketLevels, { 
      level: '', 
      price: 0, 
      quantityAvailable: 0,
      quantitySold: 0,
      feesKeptByVenue: 0,
      marketingChannel: '',
      gross: 0 
    }]);
  };

  // Remove ticket level
  const removeTicketLevel = (index: number) => {
    const previousTotal = ticketLevels.reduce((sum, level) => sum + (level.gross || 0), 0);
    const updated = ticketLevels.filter((_, i) => i !== index);
    setTicketLevels(updated);
    
    const totalGross = updated.reduce((sum, level) => sum + (level.gross || 0), 0);
    
    setPerformanceData(prev => {
      const currentGross = parseFloat(prev.grossReceipts) || 0;
      const shouldAutoUpdate = !prev.grossReceipts || prev.grossReceipts === '' || 
                               Math.abs(currentGross - previousTotal) < 0.01;
      
      return {
        ...prev,
        grossReceipts: shouldAutoUpdate 
          ? (totalGross > 0 ? totalGross.toString() : '') 
          : prev.grossReceipts,
      };
    });
  };

  // Update labor cost and recalculate total
  const updateLaborCost = (index: number, field: string, value: string | number) => {
    const updated = [...laborCosts];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total if hours or rate changes
    if (field === 'hours' || field === 'rate') {
      const hours = field === 'hours' ? parseFloat(value as string) || 0 : updated[index].hours || 0;
      const rate = field === 'rate' ? parseFloat(value as string) || 0 : updated[index].rate || 0;
      updated[index].total = hours * rate;
    }
    
    setLaborCosts(updated);
  };

  // Add new labor cost
  const addLaborCost = () => {
    setLaborCosts([...laborCosts, { role: '', hours: 0, rate: 0, total: 0 }]);
  };

  // Remove labor cost
  const removeLaborCost = (index: number) => {
    setLaborCosts(laborCosts.filter((_, i) => i !== index));
  };

  // Calculate total labor costs
  const calculateTotalLaborCosts = () => {
    return laborCosts.reduce((sum, labor) => sum + (labor.total || 0), 0);
  };

  // Calculate total expenses
  const calculateTotalExpenses = () => {
    const customExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const labor = calculateTotalLaborCosts();
    const fbcogs = parseFloat(performanceData.fbcogsDollar) || 0;
    const creditCard = parseFloat(performanceData.creditCardFees) || 0;
    const rent = parseFloat(performanceData.rentAllocation) || 0;
    const insurance = parseFloat(performanceData.insuranceAllocation) || 0;
    const utilities = parseFloat(performanceData.utilitiesAllocation) || 0;
    const marketing = parseFloat(performanceData.marketingSpend) || 0;
    const production = parseFloat(performanceData.productionCosts) || 0;
    
    return customExpenses + labor + fbcogs + creditCard + rent + insurance + utilities + marketing + production;
  };

  // Update expense
  const updateExpense = (index: number, field: string, value: string | number) => {
    const updated = [...expenses];
    updated[index] = { ...updated[index], [field]: value };
    setExpenses(updated);
  };

  // Add new expense
  const addExpense = () => {
    setExpenses([...expenses, { type: '', amount: 0, category: '' }]);
  };

  // Remove expense
  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index));
  };

  // Calculate net ticket revenue for display
  const calculateNetTicketRevenue = (): number => {
    const gross = calculateTotalGrossReceipts();
    const fees = parseFloat(performanceData.facilityFees) || 0;
    const platformFees = parseFloat(performanceData.ticketingPlatformFees) || 0;
    const taxes = parseFloat(performanceData.ticketTaxes) || 0;
    const result = gross + fees - platformFees - taxes;
    return isNaN(result) ? 0 : parseFloat(result.toFixed(2));
  };

  const handleSavePerformance = async () => {
    try {
      // First, ensure the event exists
      let eventId = providedEventId || opportunity.event?.id;
      
      // Combine event date and time
      let eventDateTime = null;
      if (performanceData.eventDate) {
        const [date, time] = [performanceData.eventDate, performanceData.eventTime || '19:00'];
        eventDateTime = new Date(`${date}T${time}:00`).toISOString();
      }
      
      if (!eventId) {
        // Create event if it doesn't exist
        const eventResponse = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: opportunity.artistName,
            startDate: eventDateTime || new Date().toISOString(),
            endDate: eventDateTime || new Date().toISOString(),
            artistName: opportunity.artistName,
          }),
        });
        
        if (eventResponse.ok) {
          const event = await eventResponse.json();
          eventId = event.id;
          
          // Link opportunity to event
          if (opportunity.id) {
            await fetch(`/api/opportunities/${opportunity.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventId }),
            });
          }
        }
      }

      if (eventId) {
        // Calculate totals
        const calculatedGross = ticketLevels.length > 0 ? calculateTotalGrossReceipts() : null;
        const grossReceipts = performanceData.grossReceipts 
          ? parseFloat(performanceData.grossReceipts) 
          : (calculatedGross || null);
        
        const totalExpenses = calculateTotalExpenses();
        const ticketsSold = parseInt(performanceData.ticketsSold) || 0;
        const capacity = parseInt(performanceData.capacity) || 0;
        const capacityUtilization = capacity > 0 ? (ticketsSold / capacity) * 100 : null;
        const revenuePerAvailableCapacity = capacity > 0 && grossReceipts ? grossReceipts / capacity : null;
        const revenuePerAttendee = ticketsSold > 0 && grossReceipts ? grossReceipts / ticketsSold : null;
        const costPerAttendee = ticketsSold > 0 ? totalExpenses / ticketsSold : null;
        
        // Calculate merch splits
        const merchSalesTotal = parseFloat(performanceData.merchSalesTotal) || 0;
        let merchVenuePortion = null;
        let merchArtistPortion = null;
        if (merchSalesTotal > 0 && performanceData.merchCommission) {
          if (performanceData.merchCommissionType === 'percentage') {
            const commissionPct = parseFloat(performanceData.merchCommission) || 0;
            merchVenuePortion = merchSalesTotal * (commissionPct / 100);
            merchArtistPortion = merchSalesTotal - merchVenuePortion;
          } else {
            merchVenuePortion = parseFloat(performanceData.merchCommission) || 0;
            merchArtistPortion = merchSalesTotal - merchVenuePortion;
          }
        }
        
        // Calculate net ticket revenue
        const grossTicketSales = calculatedGross || grossReceipts || 0;
        const facilityFees = parseFloat(performanceData.facilityFees) || 0;
        const ticketingPlatformFees = parseFloat(performanceData.ticketingPlatformFees) || 0;
        const ticketTaxes = parseFloat(performanceData.ticketTaxes) || 0;
        const netTicketRevenue = grossTicketSales + facilityFees - ticketingPlatformFees - ticketTaxes;
        
        // Calculate total gross revenue (all sources)
        const fbsalesTotal = parseFloat(performanceData.fbsalesTotal) || 0;
        const parkingRevenue = parseFloat(performanceData.parkingRevenue) || 0;
        const coatCheckRevenue = parseFloat(performanceData.coatCheckRevenue) || 0;
        const otherRevenue = parseFloat(performanceData.otherRevenue) || 0;
        const totalGrossRevenue = grossTicketSales + fbsalesTotal + merchSalesTotal + 
                                  parkingRevenue + coatCheckRevenue + otherRevenue;

        const response = await fetch(`/api/events/${eventId}/performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Event Basics
            eventDate: eventDateTime,
            genre: performanceData.genre || null,
            promoterName: performanceData.promoterName || null,
            isRecurringCustomer: performanceData.isRecurringCustomer || null,
            
            // Capacity & Attendance
            capacity: capacity,
            ticketsSold: ticketsSold,
            compTickets: parseInt(performanceData.compTickets) || null,
            
            // Advance Sales Timeline
            advanceSales30Plus: parseInt(performanceData.advanceSales30Plus) || null,
            advanceSales7to30: parseInt(performanceData.advanceSales7to30) || null,
            advanceSalesWeekOf: parseInt(performanceData.advanceSalesWeekOf) || null,
            advanceSalesDayOf: parseInt(performanceData.advanceSalesDayOf) || null,
            doorSales: parseInt(performanceData.doorSales) || null,
            
            // Ticketing Information
            ticketPrices: ticketLevels.length > 0 ? ticketLevels : null,
            
            // Deal Information
            dealType: performanceData.dealType || null,
            artistGuarantee: parseFloat(performanceData.artistGuarantee) || null,
            percentageSplit: parseFloat(performanceData.percentageSplit) || null,
            doorPriceSplitPoint: parseFloat(performanceData.doorPriceSplitPoint) || null,
            merchDeal: performanceData.merchDeal || null,
            merchCommission: performanceData.merchCommission ? parseFloat(performanceData.merchCommission) || null : null,
            merchCommissionType: performanceData.merchCommissionType || null,
            productionCosts: parseFloat(performanceData.productionCosts) || null,
            productionCostsPaidBy: performanceData.productionCostsPaidBy || null,
            
            // Revenue Streams
            grossTicketSales: grossTicketSales || null,
            facilityFees: facilityFees || null,
            ticketingPlatformFees: ticketingPlatformFees || null,
            ticketTaxes: ticketTaxes || null,
            netTicketRevenue: netTicketRevenue || null,
            fbsalesTotal: fbsalesTotal || null,
            merchSalesTotal: merchSalesTotal || null,
            merchVenuePortion: merchVenuePortion,
            merchArtistPortion: merchArtistPortion,
            parkingRevenue: parkingRevenue || null,
            coatCheckRevenue: coatCheckRevenue || null,
            otherRevenue: otherRevenue || null,
            grossReceiptsPotential: parseFloat(performanceData.grossReceiptsPotential) || null,
            grossReceipts: grossReceipts,
            totalGrossRevenue: totalGrossRevenue || null,
            
            // Operating Expenses
            laborCosts: laborCosts.length > 0 ? laborCosts : null,
            fbcogsPercentage: parseFloat(performanceData.fbcogsPercentage) || null,
            fbcogsDollar: parseFloat(performanceData.fbcogsDollar) || null,
            creditCardFees: parseFloat(performanceData.creditCardFees) || null,
            rentAllocation: parseFloat(performanceData.rentAllocation) || null,
            insuranceAllocation: parseFloat(performanceData.insuranceAllocation) || null,
            utilitiesAllocation: parseFloat(performanceData.utilitiesAllocation) || null,
            marketingSpend: parseFloat(performanceData.marketingSpend) || null,
            expenses: expenses.length > 0 ? expenses : null,
            
            // Marketing
            newCustomersAcquired: parseInt(performanceData.newCustomersAcquired) || null,
            
            // Calculated Fields
            totalExpenses: totalExpenses || null,
            capacityUtilization: capacityUtilization,
            revenuePerAvailableCapacity: revenuePerAvailableCapacity,
            revenuePerAttendee: revenuePerAttendee,
            costPerAttendee: costPerAttendee,
            
            // Post-Event Notes
            whatWorkedWell: performanceData.whatWorkedWell || null,
            whatDidntWork: performanceData.whatDidntWork || null,
            bookAgain: performanceData.bookAgain || null,
            bookAgainNotes: performanceData.bookAgainNotes || null,
            promoterRating: parseInt(performanceData.promoterRating) || null,
            audienceBehaviorNotes: performanceData.audienceBehaviorNotes || null,
            
            // Legacy fields for backward compatibility
            taxes: ticketTaxes || null,
            netReceipts: netTicketRevenue || null,
            artistPayout: parseFloat(performanceData.artistPayout) || null,
            grossProfit: parseFloat(performanceData.grossProfit) || null,
            netEventIncome: parseFloat(performanceData.netEventIncome) || null,
            perCapFb: ticketsSold > 0 && fbsalesTotal > 0 ? fbsalesTotal / ticketsSold : (parseFloat(performanceData.perCapFb) || null),
            perCapMerch: ticketsSold > 0 && merchSalesTotal > 0 ? merchSalesTotal / ticketsSold : (parseFloat(performanceData.perCapMerch) || null),
            perCapParking: parseFloat(performanceData.perCapParking) || null,
            grossPerCap: ticketsSold > 0 && totalGrossRevenue > 0 ? totalGrossRevenue / ticketsSold : (parseFloat(performanceData.grossPerCap) || null),
          }),
        });

        if (response.ok) {
          // Link opportunity to event if not already linked
          if (opportunity.id && !opportunity.eventId) {
            await fetch(`/api/opportunities/${opportunity.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventId }),
            });
          }
          alert('Performance data saved successfully!');
          if (onSave) {
            onSave();
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to save performance data: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error saving performance:', error);
      alert('Failed to save performance data');
    }
  };

  // The rest of the JSX form will be here - splitting due to length
  // This is a placeholder for the full form which is ~1200 lines
  // I'll continue in the next part...

