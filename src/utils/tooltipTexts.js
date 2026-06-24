import i18n from "../i18n"; // apne i18n config ka correct path

// Tooltip texts for dashboard metrics
export const TOOLTIP_TEXTS = {
  // GP Master Data Metrics
  COVERAGE_PERCENTAGE: i18n.t("tooltip:coveragePercentageTooltip"),
  TOTAL_GP_MASTER_DATA: i18n.t("tooltip:totalGpMasterDataTooltip"),
  VILLAGE_GP_DATA_COVERAGE: i18n.t("tooltip:villageGpDataCoverageTooltip"),
  TOTAL_FUNDS_SANCTIONED: i18n.t("tooltip:totalFundsSanctionedTooltip"),
  TOTAL_WORK_ORDER_AMOUNT: i18n.t("tooltip:totalWorkOrderAmountTooltip"),
  SBMG_TARGET_ACHIEVEMENT_RATE: i18n.t("tooltip:sbmgTargetAchievementRateTooltip"),
  SCHEME_ACHIEVEMENT_PERCENTAGE: i18n.t("tooltip:schemeAchievementPercentageTooltip"),
  FUND_UTILIZATION_RATE: i18n.t("tooltip:fundUtilizationRateTooltip"),
  AVERAGE_COST_PER_HOUSEHOLD_D2D: i18n.t("tooltip:averageCostPerHouseholdD2DTooltip"),
  HOUSEHOLDS_COVERED_D2D: i18n.t("tooltip:householdsCoveredD2DTooltip"),
  GPS_WITH_ASSET_GAPS: i18n.t("tooltip:gpsWithAssetGapsTooltip"),
  ACTIVE_SANITATION_BIDDERS: i18n.t("tooltip:activeSanitationBiddersTooltip"),
  AMOUNT_IN_LAKHS_CONVERSION: i18n.t("tooltip:amountInLakhsConversionTooltip"),
  TOTAL_SCHEME_TARGET: i18n.t("tooltip:totalSchemeTargetTooltip"),
  TOTAL_SCHEME_ACHIEVEMENT: i18n.t("tooltip:totalSchemeAchievementTooltip"),

  // District Wise Coverage Metrics
  TOTAL_GPS: i18n.t("tooltip:totalGpsTooltip"),
  GPS_WITH_DATA: i18n.t("tooltip:gpsWithDataTooltip"),

  // Inspection Metrics
  INSPECTION_OVERALL_SCORE: i18n.t("tooltip:inspectionOverallScoreTooltip"),
  INSPECTION_HOUSEHOLD_WASTE_SCORE: i18n.t("tooltip:inspectionHouseholdWasteScoreTooltip"),
  INSPECTION_ROAD_CLEANING_SCORE: i18n.t("tooltip:inspectionRoadCleaningScoreTooltip"),
  INSPECTION_DRAIN_CLEANING_SCORE: i18n.t("tooltip:inspectionDrainCleaningScoreTooltip"),
  INSPECTION_COMMUNITY_SANITATION_SCORE: i18n.t("tooltip:inspectionCommunitySanitationScoreTooltip"),
  INSPECTION_OTHER_SCORE: i18n.t("tooltip:inspectionOtherScoreTooltip"),
  INSPECTION_COVERAGE_PERCENTAGE: i18n.t("tooltip:inspectionCoveragePercentageTooltip"),
  TOTAL_INSPECTIONS: i18n.t("tooltip:totalInspectionsTooltip"),
  AVERAGE_INSPECTION_SCORE: i18n.t("tooltip:averageInspectionScoreTooltip"),
  CRITICAL_ISSUES: i18n.t("tooltip:criticalIssuesTooltip"),

  // Complaint Metrics
  COMPLAINT_SCORE: i18n.t("tooltip:complaintScoreTooltip"),
  AVERAGE_RESOLUTION_TIME: i18n.t("tooltip:averageResolutionTimeTooltip"),
  TOTAL_COMPLAINTS: i18n.t("tooltip:totalComplaintsTooltip"),
  RESOLVED_COMPLAINTS: i18n.t("tooltip:resolvedComplaintsTooltip"),
  PENDING_COMPLAINTS: i18n.t("tooltip:pendingComplaintsTooltip"),

  // Notice Metrics
  TOTAL_NOTICES_SENT: i18n.t("tooltip:totalNoticesSentTooltip"),
  TOTAL_NOTICES_RECEIVED: i18n.t("tooltip:totalNoticesReceivedTooltip"),

  // Additional common tooltips
  AVERAGE_RATING: i18n.t("tooltip:averageRatingTooltip"),
  TOTAL_RATINGS: i18n.t("tooltip:totalRatingsTooltip"),
  PERFORMANCE_TREND: i18n.t("tooltip:performanceTrendTooltip"),
  DEFAULT: i18n.t("tooltip:defaultTooltip"),

  // Contractor Details
  total_filled_constrator: i18n.t("tooltip:contractorWithDataFilledTooltip"),
  Contractor_Coverage_Percentage: i18n.t("tooltip:contractorCoveragePercentageTooltip"),
  Total_amount: i18n.t("tooltip:totalAmountTooltip"),
};

// Get tooltip text by key, with fallback
export const getTooltipText = (key) => {
  return TOOLTIP_TEXTS[key] || TOOLTIP_TEXTS.DEFAULT;
};