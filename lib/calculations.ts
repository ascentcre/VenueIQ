/**
 * Event Performance Calculation Utilities
 * All calculations are performed server-side for accuracy and stored in the database
 */

export interface EventPerformanceData {
  // Deal structure
  dealType?: 'Versus' | 'Flat Guarantee' | 'Percentage' | 'Hybrid';
  artistGuarantee?: number;
  percentageSplit?: number;
  hybridDoorSplitPoint?: number;
  
  // Revenue
  grossTicketSales?: number;
  facilityFeesKept?: number;
  ticketingFeesPaidToPlatform?: number;
  taxes?: number;
  fbSales?: number;
  totalMerchSales?: number;
  merchSplitType?: 'Percentage' | 'Flat Fee';
  merchSplitValue?: number;
  parkingRevenue?: number;
  otherRevenue?: number;
  customRevenueStreams?: Array<{ amount: number }>;
  
  // Expenses
  bartenderHours?: number;
  bartenderRate?: number;
  securityHours?: number;
  securityRate?: number;
  soundLightingTech?: number;
  doorBoxOfficeHours?: number;
  doorBoxOfficeRate?: number;
  fbCostOfGoods?: number;
  creditCardFees?: number;
  ticketPlatformFees?: number;
  productionCosts?: number;
  customExpenses?: Array<{ expenseAmount: number }>;
  
  // Attendance
  ticketsSold?: number;
  venueCapacity?: number;
}

/**
 * Calculate artist payout based on deal type
 */
export function calculateArtistPayout(data: EventPerformanceData): number {
  const netTicketRevenue = calculateNetTicketRevenue(data);
  
  if (!data.dealType || !netTicketRevenue) {
    return 0;
  }
  
  switch (data.dealType) {
    case 'Flat Guarantee':
      return data.artistGuarantee || 0;
      
    case 'Percentage':
      if (!data.percentageSplit) return 0;
      return netTicketRevenue * (data.percentageSplit / 100);
      
    case 'Versus':
      if (!data.percentageSplit || !data.artistGuarantee) return 0;
      const percentagePayout = netTicketRevenue * (data.percentageSplit / 100);
      return Math.max(data.artistGuarantee, percentagePayout);
      
    case 'Hybrid':
      if (!data.artistGuarantee || !data.hybridDoorSplitPoint || !data.percentageSplit) {
        return 0;
      }
      if (netTicketRevenue <= data.hybridDoorSplitPoint) {
        return data.artistGuarantee;
      } else {
        const overage = netTicketRevenue - data.hybridDoorSplitPoint;
        return data.artistGuarantee + (overage * (data.percentageSplit / 100));
      }
      
    default:
      return 0;
  }
}

/**
 * Calculate net ticket revenue
 */
export function calculateNetTicketRevenue(data: EventPerformanceData): number {
  const grossTicketSales = data.grossTicketSales || 0;
  const facilityFeesKept = data.facilityFeesKept || 0;
  const ticketingFeesPaidToPlatform = data.ticketingFeesPaidToPlatform || 0;
  const taxes = data.taxes || 0;
  
  return grossTicketSales + facilityFeesKept - ticketingFeesPaidToPlatform - taxes;
}

/**
 * Calculate venue merch portion
 */
export function calculateVenueMerchPortion(data: EventPerformanceData): number {
  const totalMerchSales = data.totalMerchSales || 0;
  
  if (!data.merchSplitType || !data.merchSplitValue) {
    return 0;
  }
  
  if (data.merchSplitType === 'Percentage') {
    return totalMerchSales * (data.merchSplitValue / 100);
  } else {
    // Flat fee - venue gets the flat amount
    return data.merchSplitValue;
  }
}

/**
 * Calculate total gross revenue
 */
export function calculateTotalGrossRevenue(data: EventPerformanceData): number {
  const netTicketRevenue = calculateNetTicketRevenue(data);
  const fbSales = data.fbSales || 0;
  const venueMerchPortion = calculateVenueMerchPortion(data);
  const parkingRevenue = data.parkingRevenue || 0;
  const otherRevenue = data.otherRevenue || 0;
  
  // Sum all custom revenue streams
  const customRevenueTotal = (data.customRevenueStreams || []).reduce(
    (sum, stream) => sum + (stream.amount || 0),
    0
  );
  
  return netTicketRevenue + fbSales + venueMerchPortion + parkingRevenue + otherRevenue + customRevenueTotal;
}

/**
 * Calculate total labor cost
 */
export function calculateTotalLaborCost(data: EventPerformanceData): number {
  const bartenderCost = (data.bartenderHours || 0) * (data.bartenderRate || 0);
  const securityCost = (data.securityHours || 0) * (data.securityRate || 0);
  const soundLightingTech = data.soundLightingTech || 0;
  const doorBoxOfficeCost = (data.doorBoxOfficeHours || 0) * (data.doorBoxOfficeRate || 0);
  
  return bartenderCost + securityCost + soundLightingTech + doorBoxOfficeCost;
}

/**
 * Calculate total expenses
 */
export function calculateTotalExpenses(data: EventPerformanceData): number {
  const totalLaborCost = calculateTotalLaborCost(data);
  const fbCostOfGoods = data.fbCostOfGoods || 0;
  const creditCardFees = data.creditCardFees || 0;
  const ticketPlatformFees = data.ticketPlatformFees || 0;
  const productionCosts = data.productionCosts || 0;
  
  const customExpensesTotal = (data.customExpenses || []).reduce(
    (sum, exp) => sum + (exp.expenseAmount || 0),
    0
  );
  
  return totalLaborCost + fbCostOfGoods + creditCardFees + ticketPlatformFees + 
         productionCosts + customExpensesTotal;
}

/**
 * Calculate gross profit
 */
export function calculateGrossProfit(data: EventPerformanceData): number {
  const totalGrossRevenue = calculateTotalGrossRevenue(data);
  const totalExpenses = calculateTotalExpenses(data);
  
  return totalGrossRevenue - totalExpenses;
}

/**
 * Calculate net event income
 */
export function calculateNetEventIncome(data: EventPerformanceData): number {
  const grossProfit = calculateGrossProfit(data);
  const artistPayout = calculateArtistPayout(data);
  
  return grossProfit - artistPayout;
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(data: EventPerformanceData): number {
  const totalGrossRevenue = calculateTotalGrossRevenue(data);
  if (totalGrossRevenue === 0) return 0;
  
  const netEventIncome = calculateNetEventIncome(data);
  return (netEventIncome / totalGrossRevenue) * 100;
}

/**
 * Calculate capacity utilization
 */
export function calculateCapacityUtilization(data: EventPerformanceData): number {
  const ticketsSold = data.ticketsSold || 0;
  const venueCapacity = data.venueCapacity || 0;
  
  if (venueCapacity === 0) return 0;
  
  return (ticketsSold / venueCapacity) * 100;
}

/**
 * Calculate revenue per available capacity
 */
export function calculateRevenuePerAvailableCapacity(data: EventPerformanceData): number {
  const totalGrossRevenue = calculateTotalGrossRevenue(data);
  const venueCapacity = data.venueCapacity || 0;
  
  if (venueCapacity === 0) return 0;
  
  return totalGrossRevenue / venueCapacity;
}

/**
 * Calculate revenue per attendee
 */
export function calculateRevenuePerAttendee(data: EventPerformanceData): number {
  const totalGrossRevenue = calculateTotalGrossRevenue(data);
  const ticketsSold = data.ticketsSold || 0;
  
  if (ticketsSold === 0) return 0;
  
  return totalGrossRevenue / ticketsSold;
}

/**
 * Calculate cost per attendee
 */
export function calculateCostPerAttendee(data: EventPerformanceData): number {
  const totalExpenses = calculateTotalExpenses(data);
  const ticketsSold = data.ticketsSold || 0;
  
  if (ticketsSold === 0) return 0;
  
  return totalExpenses / ticketsSold;
}

/**
 * Calculate F&B per cap
 */
export function calculateFbPerCap(data: EventPerformanceData): number {
  const fbSales = data.fbSales || 0;
  const ticketsSold = data.ticketsSold || 0;
  
  if (ticketsSold === 0) return 0;
  
  return fbSales / ticketsSold;
}

/**
 * Calculate merch per cap
 */
export function calculateMerchPerCap(data: EventPerformanceData): number {
  const venueMerchPortion = calculateVenueMerchPortion(data);
  const ticketsSold = data.ticketsSold || 0;
  
  if (ticketsSold === 0) return 0;
  
  return venueMerchPortion / ticketsSold;
}

/**
 * Calculate total per cap
 */
export function calculateTotalPerCap(data: EventPerformanceData): number {
  return calculateRevenuePerAttendee(data);
}

/**
 * Calculate all derived fields for an event performance
 */
export function calculateAllFields(data: EventPerformanceData) {
  const netTicketRevenue = calculateNetTicketRevenue(data);
  const venueMerchPortion = calculateVenueMerchPortion(data);
  const totalGrossRevenue = calculateTotalGrossRevenue(data);
  const totalLaborCost = calculateTotalLaborCost(data);
  const totalExpenses = calculateTotalExpenses(data);
  const artistPayout = calculateArtistPayout(data);
  const grossProfit = calculateGrossProfit(data);
  const netEventIncome = calculateNetEventIncome(data);
  const profitMargin = calculateProfitMargin(data);
  const capacityUtilization = calculateCapacityUtilization(data);
  const revenuePerAvailableCapacity = calculateRevenuePerAvailableCapacity(data);
  const revenuePerAttendee = calculateRevenuePerAttendee(data);
  const costPerAttendee = calculateCostPerAttendee(data);
  const fbPerCap = calculateFbPerCap(data);
  const merchPerCap = calculateMerchPerCap(data);
  const totalPerCap = calculateTotalPerCap(data);
  
  return {
    netTicketRevenue,
    venueMerchPortion,
    artistMerchPortion: (data.totalMerchSales || 0) - venueMerchPortion,
    totalGrossRevenue,
    totalLaborCost,
    totalExpenses,
    artistPayout,
    grossProfit,
    netEventIncome,
    profitMargin,
    capacityUtilization,
    revenuePerAvailableCapacity,
    revenuePerAttendee,
    costPerAttendee,
    fbPerCap,
    merchPerCap,
    totalPerCap,
  };
}

