export const mapAssetsApiToUI = (res) => {
  return {
    // ODF
    ihhl: res?.odf_sustainability?.ihhl || 0,
    community_sanitary: res?.odf_sustainability?.csc || 0,
    total_csc: res?.odf_sustainability?.csc_shala_darpan || 0,

    // SWM
    segregation_hh: res?.swm_assets?.bins_hh_level || 0,
    segregation_public: res?.swm_assets?.bins_public_places || 0,
    compost_pit: res?.swm_assets?.community_compost_pits || 0,
    hh_compost_pit: res?.swm_assets?.hh_compost_pit || 0,
    segregation_sheds: res?.swm_assets?.segregation_sheds || 0,
    Tricycles_Manual: res?.swm_assets?.tricycles_manual || 0,
    e_rickshaws_bettery: res?.swm_assets?.e_rickshaws || 0,
    Motorized_Vehicles: res?.swm_assets?.motorized_vehicles || 0,

    // LWM
    Soak_Leach_Pits: res?.lwm_assets?.pits_hh_level || 0,
    Community_Soak_Leach_Pits: res?.lwm_assets?.community_pits || 0,
    WSP_Waste_Stabilization_Pond: res?.lwm_assets?.wsp || 0,
    Dewats: res?.lwm_assets?.dewats || 0,
    Wetland: res?.lwm_assets?.wetlands || 0,
    Any_other_Trenching: res?.lwm_assets?.other_treatments || 0,
    Drainage_channels: res?.lwm_assets?.drainage_channels || 0,

    // PWMU
    Total_no_established_pwmu: res?.pwmu?.established_pwmu || 0,
    Total_no_Blocks_Covered_Under_PWMU: res?.pwmu?.blocks_covered_pwmu || 0,
    Total_No_of_Urban_MRFs: res?.pwmu?.urban_mrfs || 0,
    Total_No_Blocks_Covered_Under_Urban_MRFs: res?.pwmu?.blocks_covered_urban_mrf || 0,

    // FSM
    No_twin_pits_Toilets: res?.fsm?.twin_pit_toilets || 0,
    Single_pits_Toilets: res?.fsm?.single_pit_toilets || 0,
    Septic_bank_Toilets: res?.fsm?.septic_tank_toilets || 0,
    Retrofitted_toilets: res?.fsm?.retrofitted_toilets || 0,
    Mechanized_DeSludging: res?.fsm?.mechanized_desludging || 0,

    FSTPs: {
      rural: res?.fsm?.fstps_rural || 0,
      urban: res?.fsm?.fstps_urban || 0,
    },

    GOBARDhan_Project: res?.gobardhan?.total_projects || 0,

    // D2D
    // Total_gps: res?.d2d_activities?.gps_with_d2d_active || 0,

    Total_Work_Sanctioned_Status: [
      { label: "Tender", value: res?.d2d_activities?.sanctioned_tender || 0 },
      { label: "Self GP", value: res?.d2d_activities?.sanctioned_self_gp || 0 },
      { label: "CSR/NGO", value: res?.d2d_activities?.sanctioned_csr_ngo || 0 },
      { label: "SHG", value: res?.d2d_activities?.sanctioned_shg || 0 },
      { label: "Mixed Model", value: res?.d2d_activities?.sanctioned_mixed_model || 0 },
    ],

    not_started_gp: res?.d2d_activities?.not_started_gps || 0,
    Total_Expenditure_Amt: res?.d2d_activities?.total_expenditure || 0,
    Total_Vehicles_Collection_transportation_waste: res?.d2d_activities?.vehicles_deployed || 0,
    Total_Persons_Deployed: res?.d2d_activities?.persons_deployed || 0,
    Total_House_Hold_Covered: res?.d2d_activities?.households_covered || 0,

    CONTRACTORS_ENDING_NEXT_MONTH: res?.contracts_ending_next_month || 0,

    work_status: [
      { label: "NOT_STARTED", value: res?.d2d_activities?.status_start || 0 },
      { label: "Running", value: res?.d2d_activities?.status_running || 0 },
      // { label: "Completed", value: res?.d2d_activities?.status_completed || 0 },
    ],


    WORK_FREQUENCY: [
      { label: "DAILY", value: res?.d2d_activities?.work_frequency_count?.none || 0 },
      { label: "WEEKLY", value: res?.d2d_activities?.work_frequency_count?.weekly || 0 },
      { label: "FORTNIGHTLY", value: res?.d2d_activities?.work_frequency_count?.["15 days"] || 0 },
      { label: "MONTHLY", value: res?.d2d_activities?.work_frequency_count?.monthly || 0 },
    ],



    OWNED_VEHICLES: [
      { label: "E_RICKSHAWS", value: res?.vehicle_assets?.owned_e_rickshaws || 0 },
      { label: "MOTORIZED_VEHICLES", value: res?.vehicle_assets?.owned_motorized_vehicles || 0 },
    ],
    CONTRACTOR_VEHICLES: [
      { label: "E_RICKSHAWS", value: res?.vehicle_assets?.contractor_e_rickshaws || 0 },
      { label: "MOTORIZED_VEHICLES", value: res?.vehicle_assets?.contractor_motorized_vehicles || 0 },
    ],



    // Back bartan
    bartan_bank: res?.bartan_bank?.established_banks || 0,

    // vehicle_assets
    // ownedERickshaws: res?.vehicle_assets?.owned_e_rickshaws || 0,
    // ownedMotorizedVehicles: res?.vehicle_assets?.owned_motorized_vehicles || 0,
    // contractorERickshaws: res?.vehicle_assets?.contractor_e_rickshaws || 0,
    // contractorMotorizedVehicles: res?.vehicle_assets?.contractor_motorized_vehicles || 0,

    // Gobara Dhan 
    total_sanctioned: res?.gobardhan?.total_sanctioned || 0,
    total_functional: res?.gobardhan?.total_functional || 0,
    Gas_Production: res?.gobardhan?.gas_production || 0,


  };
};