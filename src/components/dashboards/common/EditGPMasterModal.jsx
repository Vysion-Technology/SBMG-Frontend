import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import apiClient, { annualSurveysAPI, villagesAPI } from '../../../services/api';

const FREQ_OPTIONS = ['DAILY',
  'ALTERNATE_DAYS',
  'TWICE_A_WEEK',
  'WEEKLY',
  'FORTNIGHTLY',
  'NONE'];
const FUND_HEAD_OPTIONS = ['FFC', 'SFC', 'CSR', 'OWN_INCOME', 'OTHER'];

const options = [
  { label: 'YES', value: true },
  { label: 'NO', value: false }
];



const emptyWorkOrder = () => ({ work_order_no: '', work_order_date: '', work_order_amount: '' });
const emptyFundSanctioned = () => ({ amount: '', head: 'FFC' });
const emptyDoorToDoor = () => ({ num_households: '', num_shops: '', collection_frequency: 'DAILY' });
const emptyRoadSweeping = () => ({ width: '', length: '', cleaning_frequency: 'DAILY' });
const emptyDrainCleaning = () => ({ length: '', cleaning_frequency: 'DAILY' });
const emptyCscDetails = () => ({ numbers: '', cleaning_frequency: 'DAILY' });
const emptySwmAssets = () => ({ rrc: '', pwmu: '', compost_pit: '', collection_vehicle: '' });
const emptySbmgTargets = () => ({
  ihhl: '', csc: '', rrc: '', pwmu: '', soak_pit: '', magic_pit: '', leach_pit: '', wsp: '', dewats: ''
});
const emptyVillage = () => ({
  village_id: 0,
  village_name: '',
  population: '',
  num_households: '',
  sbmg_assets: { ihhl: '', csc: '' },
  gwm_assets: { soak_pit: '', magic_pit: '', leach_pit: '', wsp: '', dewats: '' }
});



function mapGetToForm(data) {
  const o = (x, d) => (x != null && typeof x === 'object' ? x : d);
  const n = (x, d = 0) => (typeof x === 'number' && !isNaN(x) ? x : (parseFloat(x) || d));
  const s = (x, d = '') => (x != null && String(x).trim() !== '' ? String(x).trim() : d);

  const wo = o(data.work_order, {});
  const fs = o(data.fund_sanctioned, {});
  const rs = o(data.road_sweeping, {});
  const dc = o(data.drain_cleaning, {});
  const csc = o(data.csc_details, {});
  const sbmg = o(data.sbmg_targets, {});
  const swm = o(data.swm_assets, {});
  const lwm = o(data.lwm_assets, {});
  const pwmu = o(data.pwmu_details, {});
  const fsm = o(data.fsm_details, {});
  const gobardhan = o(data.gobardhan_projects, {});
  const d2d = o(data.d2d_activities, {});
  const vehicle_assets = o(data.vehicle_assets, {});

  const vlist = Array.isArray(data.village_data) ? data.village_data : [];
  const village_data = vlist.length > 0
    ? vlist.map((v) => ({
      village_id: n(v.village_id),
      agency_id: data.agency_id ?? '',
      village_name: s(v.village_name),
      population: n(v.population),
      num_households: n(v.num_households),
      sbmg_assets: {
        ihhl: n(o(v.sbmg_assets, {}).ihhl),
        csc: n(o(v.sbmg_assets, {}).csc)
      },
      gwm_assets: {
        soak_pit: n(o(v.gwm_assets, {}).soak_pit),
        magic_pit: n(o(v.gwm_assets, {}).magic_pit),
        leach_pit: n(o(v.gwm_assets, {}).leach_pit),
        wsp: n(o(v.gwm_assets, {}).wsp),
        dewats: n(o(v.gwm_assets, {}).dewats)
      },
      odf_sustainability: {
        ihhl: n(o(data.odf_sustainability, {}).ihhl),
        // retrofitting: n(o(data.odf_sustainability, {}).retrofitting),
        csc: n(o(data.odf_sustainability, {}).csc),
        csc_shala_darpan: n(o(data.odf_sustainability, {}).csc_shala_darpan)
      },
    }))
    : [emptyVillage()];

  return {
    agency_id: data.agency_id ?? '',
    agency_name: data.agency_name ?? '',
    sarpanch_name: s(data.sarpanch_name),
    vdo_name: s(data.vdo_name),
    vdo_contact_number: s(data.vdo_contact_number),
    sarpanch_contact: s(data.sarpanch_contact),
    num_ward_panchs: n(data.num_ward_panchs),
    work_order: {
      work_order_no: s(wo.work_order_no),
      work_order_date: s(wo.work_order_date) || new Date().toISOString().split('T')[0],
      work_order_amount: n(wo.work_order_amount)
    },
    fund_sanctioned: {
      amount: n(fs.amount),
      head: s(fs.head, 'FFC')
    },
    door_to_door_collection: {
      num_households: n(d2d.num_households),
      num_shops: n(d2d.num_shops),
      collection_frequency: FREQ_OPTIONS.includes(d2d.collection_frequency) ? d2d.collection_frequency : 'DAILY'
    },
    road_sweeping: {
      width: n(rs.width),
      length: n(rs.length),
      cleaning_frequency: FREQ_OPTIONS.includes(rs.cleaning_frequency) ? rs.cleaning_frequency : 'DAILY'
    },
    drain_cleaning: {
      length: n(dc.length),
      cleaning_frequency: FREQ_OPTIONS.includes(dc.cleaning_frequency) ? dc.cleaning_frequency : 'DAILY'
    },
    csc_details: {
      numbers: n(csc.numbers),
      cleaning_frequency: FREQ_OPTIONS.includes(csc.cleaning_frequency) ? csc.cleaning_frequency : 'DAILY'
    },
    swm_assets: {
      bins_hh_level: n(swm.bins_hh_level),
      bins_public_places: n(swm.bins_public_places),
      community_compost_pits: n(swm.community_compost_pits),
      hh_compost_pit: n(swm.hh_compost_pit),
      segregation_sheds: n(swm.segregation_sheds),
      tricycles_manual: n(swm.tricycles_manual),
      e_rickshaws: n(swm.e_rickshaws),
      motorized_vehicles: n(swm.motorized_vehicles)
    },
    odf_sustainability: {
      ihhl: n(o(data.odf_sustainability, {}).ihhl),
      // retrofitting: n(o(data.odf_sustainability, {}).retrofitting),
      csc: n(o(data.odf_sustainability, {}).csc),
      csc_shala_darpan: n(o(data.odf_sustainability, {}).csc_shala_darpan)
    },
    lwm_assets: {
      pits_hh_level: n(lwm.pits_hh_level),
      community_pits: n(lwm.community_pits),
      wsp: n(lwm.wsp),
      dewats: n(lwm.dewats),
      wetlands: n(lwm.wetlands),
      other_treatments: n(lwm.other_treatments),
      drainage_channels: n(lwm.drainage_channels)
    },

    pwmu_details: {
      established_pwmu: n(pwmu.established_pwmu),
      blocks_covered_pwmu: n(pwmu.blocks_covered_pwmu),
      urban_mrfs: n(pwmu.urban_mrfs),
      blocks_covered_urban_mrf: n(pwmu.blocks_covered_urban_mrf)
    },

    fsm_details: {
      twin_pit_toilets: n(fsm.twin_pit_toilets),
      single_pit_toilets: n(fsm.single_pit_toilets),
      septic_tank_toilets: n(fsm.septic_tank_toilets),
      retrofitted_toilets: n(fsm.retrofitted_toilets),
      mechanized_desludging: n(fsm.mechanized_desludging),
      fstps_rural: n(fsm.fstps_rural),
      fstps_urban: n(fsm.fstps_urban)
    },

    gobardhan_projects: {
      total_sanctioned: n(gobardhan.total_sanctioned),
      total_functional: n(gobardhan.total_functional),
      gas_production: n(gobardhan.gas_production)
    },

    bartan_bank: {
      established_banks: n(o(data.bartan_bank, {}).established_banks)
    },

    vehicle_assets: {
      owned_tricycles: n(vehicle_assets?.owned_tricycles),
      owned_e_rickshaws: n(vehicle_assets?.owned_e_rickshaws),
      owned_motorized_vehicles: n(vehicle_assets?.owned_motorized_vehicles),
      contractor_tricycles: n(vehicle_assets?.contractor_tricycles),
      contractor_e_rickshaws: n(vehicle_assets?.contractor_e_rickshaws),
      contractor_motorized_vehicles: n(vehicle_assets?.contractor_motorized_vehicles),
    },

    d2d_activities: {
      is_active: d2d.is_active ?? false,
      sanctioned_tender: n(d2d.sanctioned_tender),
      sanctioned_self_gp: n(d2d.sanctioned_self_gp),
      sanctioned_csr_ngo: n(d2d.sanctioned_csr_ngo),
      sanctioned_shg: n(d2d.sanctioned_shg),
      sanctioned_mixed_model: n(d2d.sanctioned_mixed_model),
      total_expenditure: n(d2d.total_expenditure),
      vehicles_deployed: n(d2d.vehicles_deployed),
      persons_deployed: n(d2d.persons_deployed),
      households_covered: n(d2d.households_covered),
      status_start: n(d2d.status_start),
      status_running: n(d2d.status_running),
      status_completed: n(d2d.status_completed)
    },
    // sbmg_targets: {
    //   ihhl: n(sbmg.ihhl),
    //   csc: n(sbmg.csc),
    //   rrc: n(sbmg.rrc),
    //   pwmu: n(sbmg.pwmu),
    //   soak_pit: n(sbmg.soak_pit),
    //   magic_pit: n(sbmg.magic_pit),
    //   leach_pit: n(sbmg.leach_pit),
    //   wsp: n(sbmg.wsp),
    //   dewats: n(sbmg.dewats)
    // },
    village_data
  };
}

function formToPayload(form) {
  const n = (x) => {
    if (x === "" || x === null || x === undefined) return 0;
    const num = Number(x);
    return Number.isInteger(num) ? num : Math.floor(num || 0);
  };

  const s = (x) => (x != null ? String(x) : '');

  return {
    fy_id: Number(form.fy_id) || 0, // optional (add case me override ho raha h)
    gp_id: Number(form.gp_id) || 0,

    survey_date: s(form.survey_date) || new Date().toISOString().split('T')[0],

    vdo_id: Number(form.vdo_id) || 0,
    vdo_name: s(form.vdo_name),
    vdo_contact_number: s(form.vdo_contact_number),

    sarpanch_name: s(form.sarpanch_name),
    sarpanch_contact: s(form.sarpanch_contact),

    num_ward_panchs: n(form.num_ward_panchs),

    agency_id: Number(form.agency_id) || null,

    work_order: {
      work_order_no: s(form.work_order?.work_order_no),
      work_order_date:
        s(form.work_order?.work_order_date) ||
        new Date().toISOString().split('T')[0],
      work_order_amount: n(form.work_order?.work_order_amount)
    },

    fund_sanctioned: {
      amount: n(form.fund_sanctioned?.amount),
      head: s(form.fund_sanctioned?.head) || 'FFC'
    },

    door_to_door_collection: {
      num_households: n(form.door_to_door_collection?.num_households),
      num_shops: n(form.door_to_door_collection?.num_shops),
      collection_frequency:
        form.door_to_door_collection?.collection_frequency || 'DAILY'
    },

    road_sweeping: {
      width: n(form.road_sweeping?.width),
      length: n(form.road_sweeping?.length),
      cleaning_frequency:
        form.road_sweeping?.cleaning_frequency || 'DAILY'
    },

    drain_cleaning: {
      length: n(form.drain_cleaning?.length),
      cleaning_frequency:
        form.drain_cleaning?.cleaning_frequency || 'DAILY'
    },

    csc_details: {
      numbers: n(form.csc_details?.numbers),
      cleaning_frequency:
        form.csc_details?.cleaning_frequency || 'DAILY'
    },

    // ✅ NEW
    odf_sustainability: {
      ihhl: n(form.odf_sustainability?.ihhl),
      retrofitting: n(form.odf_sustainability?.retrofitting),
      csc: n(form.odf_sustainability?.csc),
      csc_shala_darpan: n(form.odf_sustainability?.csc_shala_darpan)
    },

    // ✅ UPDATED SWM (new structure)
    swm_assets: {
      bins_hh_level: n(form.swm_assets?.bins_hh_level),
      bins_public_places: n(form.swm_assets?.bins_public_places),
      community_compost_pits: n(form.swm_assets?.community_compost_pits),
      hh_compost_pit: n(form.swm_assets?.hh_compost_pit),
      segregation_sheds: n(form.swm_assets?.segregation_sheds),
      tricycles_manual: n(form.swm_assets?.tricycles_manual),
      e_rickshaws: n(form.swm_assets?.e_rickshaws),
      motorized_vehicles: n(form.swm_assets?.motorized_vehicles)
    },

    // ✅ NEW
    lwm_assets: {
      pits_hh_level: n(form.lwm_assets?.pits_hh_level),
      community_pits: n(form.lwm_assets?.community_pits),
      wsp: n(form.lwm_assets?.wsp),
      dewats: n(form.lwm_assets?.dewats),
      wetlands: n(form.lwm_assets?.wetlands),
      other_treatments: n(form.lwm_assets?.other_treatments),
      drainage_channels: n(form.lwm_assets?.drainage_channels)
    },

    // ✅ NEW
    pwmu_details: {
      established_pwmu: n(form.pwmu_details?.established_pwmu),
      blocks_covered_pwmu: n(form.pwmu_details?.blocks_covered_pwmu),
      urban_mrfs: n(form.pwmu_details?.urban_mrfs),
      blocks_covered_urban_mrf: n(form.pwmu_details?.blocks_covered_urban_mrf)
    },

    // ✅ NEW
    fsm_details: {
      twin_pit_toilets: n(form.fsm_details?.twin_pit_toilets),
      single_pit_toilets: n(form.fsm_details?.single_pit_toilets),
      septic_tank_toilets: n(form.fsm_details?.septic_tank_toilets),
      retrofitted_toilets: n(form.fsm_details?.retrofitted_toilets),
      mechanized_desludging: n(form.fsm_details?.mechanized_desludging),
      fstps_rural: n(form.fsm_details?.fstps_rural),
      fstps_urban: n(form.fsm_details?.fstps_urban)
    },

    // ✅ NEW
    gobardhan_projects: {
      total_sanctioned: n(form.gobardhan_projects?.total_sanctioned),
      total_functional: n(form.gobardhan_projects?.total_functional),
      gas_production: n(form.gobardhan_projects?.gas_production)
    },

    bartan_bank: {
      established_banks: n(form.bartan_bank?.established_banks)
    },

    vehicle_assets: {
      owned_tricycles: n(form.vehicle_assets?.owned_tricycles),
      owned_e_rickshaws: n(form.vehicle_assets?.owned_e_rickshaws),
      owned_motorized_vehicles: n(form.vehicle_assets?.owned_motorized_vehicles),
      contractor_tricycles: n(form.vehicle_assets?.contractor_tricycles),
      contractor_e_rickshaws: n(form.vehicle_assets?.contractor_e_rickshaws),
      contractor_motorized_vehicles: n(form.vehicle_assets?.contractor_motorized_vehicles),
    },

    // ✅ NEW
    d2d_activities: {
      is_active: form.d2d_activities?.is_active ?? false,
      sanctioned_tender: n(form.d2d_activities?.sanctioned_tender),
      sanctioned_self_gp: n(form.d2d_activities?.sanctioned_self_gp),
      sanctioned_csr_ngo: n(form.d2d_activities?.sanctioned_csr_ngo),
      sanctioned_shg: n(form.d2d_activities?.sanctioned_shg),
      sanctioned_mixed_model: n(form.d2d_activities?.sanctioned_mixed_model),
      total_expenditure: n(form.d2d_activities?.total_expenditure),
      vehicles_deployed: n(form.d2d_activities?.vehicles_deployed),
      persons_deployed: n(form.d2d_activities?.persons_deployed),
      households_covered: n(form.d2d_activities?.households_covered),
      status_start: n(form.d2d_activities?.status_start),
      status_running: n(form.d2d_activities?.status_running),
      status_completed: n(form.d2d_activities?.status_completed)
    },


    // sbmg_targets: {
    //   ihhl: n(form.sbmg_targets?.ihhl),
    //   csc: n(form.sbmg_targets?.csc),
    //   rrc: n(form.sbmg_targets?.rrc),
    //   pwmu: n(form.sbmg_targets?.pwmu),
    //   soak_pit: n(form.sbmg_targets?.soak_pit),
    //   magic_pit: n(form.sbmg_targets?.magic_pit),
    //   leach_pit: n(form.sbmg_targets?.leach_pit),
    //   wsp: n(form.sbmg_targets?.wsp),
    //   dewats: n(form.sbmg_targets?.dewats)
    // },

    village_data: (form.village_data || []).map((v) => ({
      village_id: n(v.village_id),
      village_name: s(v.village_name),
      population: n(v.population),
      num_households: n(v.num_households),

      sbmg_assets: {
        ihhl: n(v.sbmg_assets?.ihhl),
        csc: n(v.sbmg_assets?.csc)
      },

      gwm_assets: {
        soak_pit: n(v.gwm_assets?.soak_pit),
        magic_pit: n(v.gwm_assets?.magic_pit),
        leach_pit: n(v.gwm_assets?.leach_pit),
        wsp: n(v.gwm_assets?.wsp),
        dewats: n(v.gwm_assets?.dewats)
      }
    }))
  };
}

// const Input = ({ label, value, onChange, type = 'text', placeholder = '', disabled, min }) => (
//   <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
//     <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</label>
//     <input
//       type={type}
//       value={value ?? ''}
//       onChange={(e) => onChange(e.target.value)}
//       placeholder={placeholder}
//       disabled={disabled}
//       min={min}
//       max={max}
//       required
//       style={{
//         padding: '8px 10px',
//         border: '1px solid #d1d5db',
//         borderRadius: '6px',
//         fontSize: '14px',
//         outline: 'none'
//       }}
//     />
//   </div>
// );

const Input = ({ label, value, onChange, type = 'text', placeholder = '', disabled, min, max, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>

    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
      {label}
    </label>

    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
      style={{
        padding: '8px 10px',
        border: error ? '1px solid red' : '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none'
      }}
    />

    {/* ✅ Error Show */}
    {error && (
      <span style={{ color: 'red', fontSize: '12px' }}>
        {error}
      </span>
    )}
  </div>
);

const Select = ({ label, value, onChange, options, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{label}</label>
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '8px 10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: 'white'
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

const BooleanSelect = ({ label, value, onChange, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
      {label}
    </label>

    <select
      value={value === true ? 'true' : value === false ? 'false' : ''}
      onChange={(e) => onChange(e.target.value === 'true')}
      disabled={disabled}
      style={{
        padding: '8px 10px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        fontSize: '14px',
        outline: 'none',
        backgroundColor: 'white'
      }}
    >
      <option value="">Select</option>
      <option value="true">YES</option>
      <option value="false">NO</option>
    </select>
  </div>
);

const BooleanRadio = ({ label, value, onChange, disabled }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
    <label style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>
      {label}
    </label>

    <div style={{ display: 'flex', gap: '60px' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="radio"
          value="true"
          checked={value === true}
          onChange={() => onChange(true)}
          disabled={disabled}
        /> <span>YES</span>
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="radio"
          value="false"
          checked={value === false}
          onChange={() => onChange(false)}
          disabled={disabled}
        /> NO
      </label>
    </div>
  </div>
);

const EditGPMasterModal = ({ isOpen, onClose, surveyId, gpName = 'GP', onSuccess, vdoGPId, fy_id }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [errorInagency, setErrorInagency] = useState(null);
  const [form, setForm] = useState(null);
  const [agencyesData, setAgencyesData] = useState([])
  const [moduleAgency, SetModuleAgency] = useState(false)
  const [phoneErrors, setPhoneErrors] = useState({
    sarpanch_contact: "",
    vdo_contact_number: ""
  });
  const [agencyForm, setAgencyForm] = useState({
    name: "",
    email: "",
    contact_number: "", address: ""
  });

  const [agencySearch, setAgencySearch] = useState("");
  const [agencyDropdownOpen, setAgencyDropdownOpen] = useState(false);

  // console.log(vdoGPId)
  // console.log(surveyId)


  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const res = await apiClient.get('contractors/agencies?limit=100');
        setAgencyesData(res.data.results || res.data);
      } catch (error) {
        console.log("Agencies Error:", error);
      }
    };

    if (isOpen) {
      fetchAgencies();
    }
  }, [isOpen]);

  const isEdit = !!surveyId;
  // console.log('id->', fy_id)



  const loadSurvey = useCallback(async () => {
    if (!surveyId || !isOpen) return;
    try {
      setLoading(true);
      setError(null);
      const res = await annualSurveysAPI.getSurvey(surveyId);
      setForm(mapGetToForm(res.data));

      setAgencySearch(res.data.agency_name || "");
      // view gps dataaa
      console.log(res.data)
    } catch (e) {
      console.error('Failed to load survey:', e);
      setError(e.response?.data?.detail || e.message || 'Failed to load survey.');
      setForm(null);
    } finally {
      setLoading(false);
    }
  }, [surveyId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (surveyId) {
      loadSurvey();   // Edit mode
    } else {
      // ✅ Create mode
      setForm({
        agency_id: '',
        vdo_name: '',
        vdo_contact_number: '',
        sarpanch_name: '',
        sarpanch_contact: '',
        num_ward_panchs: '',

        work_order: emptyWorkOrder(),
        fund_sanctioned: emptyFundSanctioned(),
        door_to_door_collection: emptyDoorToDoor(),
        road_sweeping: emptyRoadSweeping(),
        drain_cleaning: emptyDrainCleaning(),
        csc_details: emptyCscDetails(),

        // ✅ ADD THESE
        odf_sustainability: {
          ihhl: '',
          retrofitting: '',
          csc: '',
          csc_shala_darpan: ''
        },

        swm_assets: {
          bins_hh_level: '',
          bins_public_places: '',
          community_compost_pits: '',
          segregation_sheds: '',
          tricycles_manual: '',
          e_rickshaws: '',
          motorized_vehicles: '',
          hh_compost_pit: ''
        },

        lwm_assets: {
          pits_hh_level: '',
          community_pits: '',
          wsp: '',
          dewats: '',
          wetlands: '',
          other_treatments: '',
          drainage_channels: ''
        },

        pwmu_details: {
          established_pwmu: '',
          blocks_covered_pwmu: '',
          urban_mrfs: '',
          blocks_covered_urban_mrf: ''
        },

        fsm_details: {
          twin_pit_toilets: '',
          single_pit_toilets: '',
          septic_tank_toilets: '',
          retrofitted_toilets: '',
          mechanized_desludging: '',
          fstps_rural: '',
          fstps_urban: ''
        },

        gobardhan: {
          total_sanctioned: '',
          total_functional: '',
          gas_production: '',
        },

        d2d_activities: {
          is_active: false,
          sanctioned_tender: '',
          sanctioned_self_gp: '',
          sanctioned_csr_ngo: '',
          sanctioned_mixed_model: '',
          sanctioned_shg: '',
          total_expenditure: '',
          vehicles_deployed: '',
          persons_deployed: '',
          households_covered: '',
          status_start: '',
          status_running: '',
          status_completed: ''
        },

        bartan_bank: {
          established_banks: '',
        },

        vehicle_assets: {
          owned_tricycles: 0,
          owned_e_rickshaws: 0,
          owned_motorized_vehicles: 0,
          contractor_tricycles: 0,
          contractor_e_rickshaws: 0,
          contractor_motorized_vehicles: 0
        },

        village_data: [emptyVillage()],
      });

      setError(null);
    }
  }, [isOpen, surveyId, loadSurvey]);

  useEffect(() => {
    if (!isOpen) {
      SetModuleAgency(false);   // 🔥 Reset agency modal
    }
  }, [isOpen]);

  const update = useCallback((path, value) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        const idx = parseInt(p, 10);
        if (!isNaN(idx)) {
          cur = cur[idx];
        } else {
          if (!cur[p]) cur[p] = {};
          cur = cur[p];
        }
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  }, []);

  const updateVillage = useCallback((index, field, value) => {
    setForm((prev) => {
      if (!prev || !prev.village_data) return prev;

      const next = JSON.parse(JSON.stringify(prev));
      const v = next.village_data[index];
      if (!v) return prev;

      if (field.includes('.')) {
        const [a, b] = field.split('.');

        if (a === 'sbmg_assets') {
          v.sbmg_assets = v.sbmg_assets || {};
          v.sbmg_assets[b] = value;   // ❌ no parse
        }

        if (a === 'gwm_assets') {
          v.gwm_assets = v.gwm_assets || {};
          v.gwm_assets[b] = value;   // ❌ no parse
        }

      } else {
        v[field] = value;   // ❌ no parse
      }

      return next;
    });
  }, []);

  const handlePhoneChange = (field, value) => {
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 10);

    update(field, cleaned);

    let errorMsg = "";

    if (cleaned.length > 0 && cleaned.length < 10) {
      errorMsg = "Phone number must be 10 digits";
    } else if (cleaned.length === 10 && !/^[6-9]\d{9}$/.test(cleaned)) {
      errorMsg = "Enter valid Indian mobile number (starts with 6-9)";
    }

    setPhoneErrors(prev => ({
      ...prev,
      [field]: errorMsg
    }));
  };

  const addVillage = useCallback(() => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.village_data = next.village_data || [];
      next.village_data.push(emptyVillage());
      return next;
    });
  }, []);

  const removeVillage = useCallback((index) => {
    setForm((prev) => {
      if (!prev || !prev.village_data || prev.village_data.length <= 1) return prev;
      const next = JSON.parse(JSON.stringify(prev));
      next.village_data.splice(index, 1);
      return next;
    });
  }, []);

  // Check and store when existing villgages have
  const [existingVillages, setExistingVillages] = useState([]);

  useEffect(() => {
    const loadVillages = async () => {
      try {
        const res = await villagesAPI.getVillages(vdoGPId);
        setExistingVillages(res.data || []);
      } catch (err) {
        console.log("Failed to load villages", err);
      }
    };

    if (isOpen && vdoGPId) {
      loadVillages();
    }
  }, [isOpen, vdoGPId]);

  const handleCreateAgency = async () => {
    try {
      // Basic Validation
      if (!agencyForm.name.trim()) {
        setErrorInagency("Agency name is required");
        return;
      }

      if (!agencyForm.email.trim()) {
        setErrorInagency("Email is required");
        return;
      } else if (agencyForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(agencyForm.email)) {
        setErrorInagency("Invalid email format");
        return;
      }

      if (!agencyForm.contact_number.trim()) {
        setErrorInagency("Contact Number is required");
        return;
      } else if (agencyForm.contact_number && !/^\d{10}$/.test(agencyForm.contact_number)) {
        setErrorInagency("Contact number must be 10 digits");
        return;
      }

      const res = await apiClient.post("contractors/agencies", {
        name: agencyForm.name.trim(),
        email: agencyForm.email.trim(),
        phone: agencyForm.contact_number.trim(),
        address: agencyForm.address?.trim() || ""
      });

      const fresh = await apiClient.get("contractors/agencies");
      setAgencyesData(fresh.data.results || fresh.data);

      update("agency_id", res.data.id);

      setAgencySearch(res.data.name); // 🔥 immediately show selected

      SetModuleAgency(false);

      setAgencyForm({
        name: "",
        email: "",
        contact_number: "",
        address: ""
      });
      setErrorInagency(null)
      alert("Agency created successfully ✅");

    } catch (err) {
      alert(err.response?.data?.message || "Failed to create agency");
    }
  };

  // Agency search
  useEffect(() => {
    if (!agencyDropdownOpen) return;

    const delay = setTimeout(async () => {
      try {
        const res = await apiClient.get(
          `contractors/agencies?name_like=${agencySearch}`
        );

        setAgencyesData(res.data.results || res.data);
      } catch (err) {
        console.log("Agency search error", err);
      }
    }, 200); // debounce 400ms

    return () => clearTimeout(delay);
  }, [agencySearch, agencyDropdownOpen]);

  useEffect(() => {
    const close = () => setAgencyDropdownOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);


  const handleSubmit = useCallback(async () => {
    if (!form || saving) return;

    try {
      setSaving(true);
      setError(null);

      if (!form.vdo_contact_number || form.vdo_contact_number.length !== 10) {
        setPhoneErrors(prev => ({
          ...prev,
          vdo_contact_number: "Phone number must be 10 digits"
        }));

        setError("Please fix phone number ❌");
        setSaving(false);
        return;
      }

      if (!form.sarpanch_contact || form.sarpanch_contact.length !== 10) {
        setPhoneErrors(prev => ({
          ...prev,
          sarpanch_contact: "Phone number must be 10 digits"
        }));
        setError("Please fix phone number ❌");
        setSaving(false);
        return;
      }



      const fundAmount = Number(form.fund_sanctioned?.amount || 0);
      const workOrderAmount = Number(form.work_order?.work_order_amount || 0);

      if (workOrderAmount > fundAmount) {
        setError("Work order amount can not be higher than funds sanctioned ❌");
        setSaving(false);
        return;
      }

      // 🔥 1️⃣ Deep clone (state mutate nahi karna)
      const updatedForm = JSON.parse(JSON.stringify(form));

      // 🔥 2️⃣ Pehle naye villages create karo
      for (let i = 0; i < updatedForm.village_data.length; i++) {
        const v = updatedForm.village_data[i];

        if (!v.village_id || v.village_id === 0) {

          if (!v.village_name.trim()) {
            throw new Error("Village name required.");
          }

          try {
            const res = await villagesAPI.createVillage({
              name: v.village_name.trim(),
              gp_id: Number(vdoGPId),
              description: v.village_name.trim()
            });

            updatedForm.village_data[i].village_id = res.data.id;

          } catch (err) {

            // Agar duplicate aaye toh existing ID le lo
            if (err.response?.data?.message?.includes("unique")) {

              const fresh = await villagesAPI.getVillages(vdoGPId);

              const existing = fresh.data.find(ev =>
                ev.name.toLowerCase() === v.village_name.trim().toLowerCase()
              );

              if (existing) {
                updatedForm.village_data[i].village_id = existing.id;
              } else {
                throw err;
              }

            } else {
              throw err;
            }
          }
        }
      }

      // 🔥 3️⃣ Ab final payload banao
      const payload = formToPayload(updatedForm);

      console.log("FINAL PAYLOAD:", JSON.stringify(payload, null, 2));
      if (isEdit) {
        // 🔥 4️⃣ Survey update
        await annualSurveysAPI.updateSurvey(surveyId, payload);

      } else {
        const basePayload = formToPayload(updatedForm);

        const finalPayload = {
          ...basePayload,
          fy_id: Number(fy_id),   // ✅ ADD THIS
          gp_id: Number(vdoGPId),
          survey_date: new Date().toISOString().split('T')[0], // ✅ ADD THIS
          agency_id: Number(updatedForm.agency_id) || null
        };

        console.log("FINAL PAYLOAD:", JSON.stringify(finalPayload, null, 2));

        await annualSurveysAPI.addsurvey(finalPayload);
      }

      alert("Survey & villages saved successfully ✅");

      onSuccess?.();
      onClose?.();

    } catch (e) {
      console.log("FULL ERROR:", e.response?.data);

      const data = e.response?.data;

      if (data?.detail) {
        if (Array.isArray(data.detail)) {
          alert(data.detail.map(d => d.msg).join(", "));
        } else {
          alert(data.detail);
        }
      }
      else if (data?.message) {
        // 🔥 Duplicate village error
        alert(data.message);
      }
      else {
        alert(e.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  }, [form, saving, surveyId, onSuccess, onClose, vdoGPId]);


  const handleOverlayClick = useCallback(() => {
    if (!saving) onClose?.();
  }, [saving, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setPhoneErrors({
        sarpanch_contact: "",
        vdo_contact_number: ""
      });
      setError(null);
    }
  }, [isOpen]);

  // useEffect(() => {
  //   if (form) {
  //     console.log("FORM DATA:", form);
  //   }
  // }, [form]);

  if (!isOpen) return null;

  const section = (title, children) => (
    <div style={{ marginBottom: '20px' }}>
      <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: '0 0 10px 0', paddingBottom: '4px', borderBottom: '1px solid #e5e7eb' }}>{title}</h4>
      {children}
    </div>
  );

  const grid2 = (children) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>{children}</div>
  );
  const grid3 = (children) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>{children}</div>
  );


  const handleD2DChange = (value) => {
    update('d2d_activities.is_active', value);

    if (!value) {
      update('d2d_activities', {
        is_active: false,
        sanctioned_tender: 0,
        sanctioned_self_gp: 0,
        sanctioned_csr_ngo: 0,
        sanctioned_shg: 0,
        total_expenditure: 0,
        vehicles_deployed: 0,
        persons_deployed: 0,
        households_covered: 0,
        status_start: 0,
        status_running: 0,
        status_completed: 0
      });
    }
  };




  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 99999
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '720px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          boxShadow: '0 20px 45px -15px rgba(15,23,42,0.35)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            {isEdit ? "Edit GP Master Data" : "Add GP Master Data"} {gpName ? `— ${gpName}` : ''}
          </h2>
          <button onClick={handleOverlayClick} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }} disabled={saving}>
            <X size={22} />
          </button>
        </div>

        {error && !loading && (
          <div style={{ padding: '12px 20px', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
          {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>Loading…</div>}
          {!loading && form && (
            <>
              {section('VDO Details', grid2(
                <>
                  <Input label="VDO name" value={form.vdo_name} onChange={(v) => update('vdo_name', v)} disabled={saving} />
                  <Input
                    label="VDO contact number"
                    value={form.vdo_contact_number}
                    onChange={(v) => handlePhoneChange('vdo_contact_number', v)}
                    error={phoneErrors.vdo_contact_number}
                  />
                </>
              ))}
              {section('Basic information', grid2(
                <>
                  <Input label="Sarpanch name" value={form.sarpanch_name} onChange={(v) => update('sarpanch_name', v)} disabled={saving} />

                  <Input
                    label="Sarpanch contact"
                    value={form.sarpanch_contact}
                    onChange={(v) => handlePhoneChange('sarpanch_contact', v)}
                    error={phoneErrors.sarpanch_contact}
                  />

                  <Input label="Number of ward panchs" type="number" min={0} value={form.num_ward_panchs} onChange={(v) => update('num_ward_panchs', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}
              {section('Agency', grid2(
                <>
                  {/* Agency Filed */}
                  <div className=''>
                    <div className='text-end'>
                      <button
                        onClick={() => SetModuleAgency(true)}
                        style={{ color: '#10b981', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}
                        className='uppercase'>+ ADD Agency</button>
                    </div>
                    <div style={{ position: "relative", width: "100%" }}>

                      {/* Search Input */}
                      <input
                        type="text"
                        placeholder="Search Agency..."
                        value={agencySearch}
                        onChange={(e) => {
                          setAgencySearch(e.target.value);
                          setAgencyDropdownOpen(true);
                        }}
                        onFocus={() => setAgencyDropdownOpen(true)}
                        style={{
                          padding: "8px 10px",
                          border: "1px solid #d1d5db",
                          borderRadius: "6px",
                          fontSize: "14px",
                          width: "100%"
                        }}
                      />

                      {/* Dropdown */}
                      {agencyDropdownOpen && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#fff",
                            border: "1px solid #d1d5db",
                            borderRadius: "6px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1000
                          }}
                        >
                          {agencyesData.length === 0 && (
                            <div style={{ padding: "8px", fontSize: "13px" }}>
                              No agency found
                            </div>
                          )}

                          {agencyesData.map((agency) => (
                            <div
                              key={agency.id}
                              onClick={() => {
                                update("agency_id", agency.id);
                                setAgencySearch(agency.name);  // 👈 yaha name set karo
                                setAgencyDropdownOpen(false);
                              }}
                              style={{
                                padding: "8px",
                                cursor: "pointer",
                                fontSize: "14px"
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#f3f4f6")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "#fff")
                              }
                            >
                              {agency.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>


                  </div>

                </>
              ))}
              {section('Work order', grid3(
                <>
                  <Input label="Work order no" value={form.work_order?.work_order_no} onChange={(v) => update('work_order.work_order_no', v)} disabled={saving} />
                  <Input label="Work order date" type="date" value={form.work_order?.work_order_date} onChange={(v) => update('work_order.work_order_date', v)} disabled={saving} />
                  <Input label="Work order amount" type="number" min={0} value={form.work_order?.work_order_amount} onChange={(v) => update('work_order.work_order_amount', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}
              {section('Fund sanctioned', grid3(
                <>
                  <Input label="Amount" type="number" min={0} value={form.fund_sanctioned?.amount} onChange={(v) => update('fund_sanctioned.amount', v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Head" value={form.fund_sanctioned?.head} onChange={(v) => update('fund_sanctioned.head', v)} options={FUND_HEAD_OPTIONS} disabled={saving} />
                  {form.fund_sanctioned?.head === 'OTHER' && (
                    <Input
                      label="Specify Other Head"
                      value={form.fund_sanctioned?.other_head}
                      onChange={(v) => update('fund_sanctioned.other_head', v)}
                      placeholder="Enter fund head..."
                      disabled={saving}
                    />
                  )}
                </>
              ))}
              {section('Door to door collection', (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {grid3(
                    <>
                      <Input label="Number of households" type="number" min={0} value={form.door_to_door_collection?.num_households} onChange={(v) => update('door_to_door_collection.num_households', v === '' ? '' : Number(v))} disabled={saving} />
                      <Input label="Number of shops" type="number" min={0} value={form.door_to_door_collection?.num_shops} onChange={(v) => update('door_to_door_collection.num_shops', v === '' ? '' : Number(v))} disabled={saving} />
                      <Select label="Collection frequency" value={form.door_to_door_collection?.collection_frequency} onChange={(v) => update('door_to_door_collection.collection_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                    </>
                  )}
                </div>
              ))}
              {section('Road sweeping', grid3(
                <>
                  <Input label="Width (m)" type="number" min={0} value={form.road_sweeping?.width} onChange={(v) => update('road_sweeping.width', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Length (m)" type="number" min={0} value={form.road_sweeping?.length} onChange={(v) => update('road_sweeping.length', v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.road_sweeping?.cleaning_frequency} onChange={(v) => update('road_sweeping.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('Drain cleaning', grid2(
                <>
                  <Input label="Length (m)" type="number" min={0} value={form.drain_cleaning?.length} onChange={(v) => update('drain_cleaning.length', v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.drain_cleaning?.cleaning_frequency} onChange={(v) => update('drain_cleaning.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}
              {section('CSC details', grid2(
                <>
                  <Input label="Numbers" type="number" min={0} value={form.csc_details?.numbers} onChange={(v) => update('csc_details.numbers', v === '' ? '' : Number(v))} disabled={saving} />
                  <Select label="Cleaning frequency" value={form.csc_details?.cleaning_frequency} onChange={(v) => update('csc_details.cleaning_frequency', v)} options={FREQ_OPTIONS} disabled={saving} />
                </>
              ))}

              {section('ODF Sustainability', grid2(
                <>
                  <Input label="IHHL" type="number" min={0} value={form.odf_sustainability?.ihhl} onChange={(v) => update('odf_sustainability.ihhl', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label='Community Sanitary Complex (CSC)' type="number" min={0} value={form.odf_sustainability?.csc} onChange={(v) => update('odf_sustainability.csc', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Total No. of CSCs in Shala Darpan (Schools)" type="number" min={0} value={form.odf_sustainability?.csc_shala_darpan} onChange={(v) => update('odf_sustainability.csc_shala_darpan', v === '' ? '' : Number(v))} disabled={saving} />
                  {/* <Input label="retrofitting" type="number" min={0} value={form.odf_sustainability?.retrofitting} onChange={(v) => update('odf_sustainability.csc_shala_darpan', v === '' ? '' : Number(v))} disabled={saving} /> */}
                </>
              ))}
              {section('SWM assets', grid2(
                <>
                  <Input label="Segregation Bins at HH Level" type="number" min={0} value={form.swm_assets?.bins_hh_level} onChange={(v) => update('swm_assets.bins_hh_level', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label='Segregation Bins at Public Places' type="number" min={0} value={form.swm_assets?.bins_public_places} onChange={(v) => update('swm_assets.bins_public_places', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Community Compost Pit" type="number" min={0} value={form.swm_assets?.community_compost_pits} onChange={(v) => update('swm_assets.community_compost_pits', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Segregation Sheds(RRC)" type="number" min={0} value={form.swm_assets?.segregation_sheds} onChange={(v) => update('swm_assets.segregation_sheds', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Tricycles (Manual)" type="number" min={0} value={form.swm_assets?.tricycles_manual} onChange={(v) => update('swm_assets.tricycles_manual', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="E-Rickshaws/Battery operated Vehicles" type="number" min={0} value={form.swm_assets?.e_rickshaws} onChange={(v) => update('swm_assets.e_rickshaws', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Motorized Vehicles" type="number" min={0} value={form.swm_assets?.motorized_vehicles} onChange={(v) => update('swm_assets.motorized_vehicles', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Household Compost Pit (HH Compost Pit)" type="number" min={0} value={form.swm_assets?.hh_compost_pit} onChange={(v) => update('swm_assets.hh_compost_pit', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}


              {section('Liquid Waste Management', grid2(
                <>
                  <Input label="Soak/Magic/Leach pits at HH Level" type="number" min={0} value={form.lwm_assets?.pits_hh_level} onChange={(v) => update('lwm_assets.pits_hh_level', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label='Community Soak/Magic/Leach pits' type="number" min={0} value={form.lwm_assets?.community_pits} onChange={(v) => update('lwm_assets.community_pits', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="WSP (Waste Stabilization Pond)" type="number" min={0} value={form.lwm_assets?.wsp} onChange={(v) => update('lwm_assets.wsp', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Dewats" type="number" min={0} value={form.lwm_assets?.dewats} onChange={(v) => update('lwm_assets.dewats', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Wetland" type="number" min={0} value={form.lwm_assets?.wetlands} onChange={(v) => update('lwm_assets.wetlands', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Any Other (Trenching, Phytorids, etc.)" type="number" min={0} value={form.lwm_assets?.other_treatments} onChange={(v) => update('lwm_assets.other_treatments', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Drainage channels (meters)" type="number" min={0} value={form.lwm_assets?.drainage_channels} onChange={(v) => update('lwm_assets.drainage_channels', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}

              {section('Plastic Waste Management Unit(PWMUs)', grid2(
                <>
                  <Input label="Total No. of Established PWMU" type="number" min={0} value={form.pwmu_details?.established_pwmu} onChange={(v) => update('pwmu_details.established_pwmu', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label='Total No. of Blocks Covered Under PWMU' type="number" min={0} value={form.pwmu_details?.blocks_covered_pwmu} onChange={(v) => update('pwmu_details.blocks_covered_pwmu', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Total No. of Urban MRFs" type="number" min={0} value={form.pwmu_details?.urban_mrfs} onChange={(v) => update('pwmu_details.urban_mrfs', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Total No. of Blocks Covered Under Urban MRFs" type="number" min={0} value={form.pwmu_details?.blocks_covered_urban_mrf} onChange={(v) => update('pwmu_details.blocks_covered_urban_mrf', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}

              {section('Faecal Sludge Management (FSM)', grid2(
                <>
                  <Input label="No. of twin pits Toilets" type="number" min={0} value={form.fsm_details?.twin_pit_toilets} onChange={(v) => update('fsm_details.twin_pit_toilets', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label='No. of Single pits Toilets' type="number" min={0} value={form.fsm_details?.single_pit_toilets} onChange={(v) => update('fsm_details.single_pit_toilets', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="No. of Septic tank Toilets" type="number" min={0} value={form.fsm_details?.septic_tank_toilets} onChange={(v) => update('fsm_details.septic_tank_toilets', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="No. of Retrofitted toilets" type="number" min={0} value={form.fsm_details?.retrofitted_toilets} onChange={(v) => update('fsm_details.retrofitted_toilets', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Mechanized De-Sludging" type="number" min={0} value={form.fsm_details?.mechanized_desludging} onChange={(v) => update('fsm_details.mechanized_desludging', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="No. of FSTPs Rural" type="number" min={0} value={form.fsm_details?.fstps_rural} onChange={(v) => update('fsm_details.fstps_rural', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="No. of FSTPs Urban" type="number" min={0} value={form.fsm_details?.fstps_urban} onChange={(v) => update('fsm_details.fstps_urban', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}


              {section('GOBAR-dhan Project', grid2(
                <>
                  <Input label="Total Sanctioned" type="number" min={0} value={form.gobardhan_projects?.total_sanctioned} onChange={(v) => update('gobardhan_projects.total_sanctioned', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Total Functional" type="number" min={0} value={form.gobardhan_projects?.total_functional} onChange={(v) => update('gobardhan_projects.total_functional', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Gas Production" type="number" min={0} value={form.gobardhan_projects?.gas_production} onChange={(v) => update('gobardhan_projects.gas_production', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}

              {section('Bartan Bank', grid2(
                <>
                  <Input label="Bartan Bank Information" type="number" min={0} value={form.bartan_bank?.established_banks} onChange={(v) => update('bartan_bank.established_banks', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}
              {section('Vehicle Assets', grid3(
                <>
                  <Input label="Owned Tricycles" type="number" min={0} value={form.vehicle_assets?.owned_tricycles} onChange={(v) => update('vehicle_assets.owned_tricycles', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Owned E-Rickshaws" type="number" min={0} value={form.vehicle_assets?.owned_e_rickshaws} onChange={(v) => update('vehicle_assets.owned_e_rickshaws', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Owned Motorized Vehicles" type="number" min={0} value={form.vehicle_assets?.owned_motorized_vehicles} onChange={(v) => update('vehicle_assets.owned_motorized_vehicles', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Contractor Tricycles" type="number" min={0} value={form.vehicle_assets?.contractor_tricycles} onChange={(v) => update('vehicle_assets.contractor_tricycles', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Contractor E-Rickshaws" type="number" min={0} value={form.vehicle_assets?.contractor_e_rickshaws} onChange={(v) => update('vehicle_assets.contractor_e_rickshaws', v === '' ? '' : Number(v))} disabled={saving} />
                  <Input label="Contractor Motorized Vehicles" type="number" min={0} value={form.vehicle_assets?.contractor_motorized_vehicles} onChange={(v) => update('vehicle_assets.contractor_motorized_vehicles', v === '' ? '' : Number(v))} disabled={saving} />
                </>
              ))}

              {section('Door to Door Waste Collection, Segregation & Disposal Activities', (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {/* Always visible */}
                  <BooleanRadio
                    label="Door to Door Service available in this gp"
                    value={form.d2d_activities?.is_active}
                    onChange={handleD2DChange}
                  />

                  {/* ✅ SHOW ONLY WHEN TRUE */}
                  {form.d2d_activities?.is_active === true && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                      <Input label='Contractors through Tender'
                        type="number" min={0}
                        value={form.d2d_activities?.sanctioned_tender}
                        onChange={(v) => update('d2d_activities.sanctioned_tender', v === '' ? '' : Number(v))}
                      />

                      <Input label='GP through Placement Agency'
                        type="number" min={0}
                        value={form.d2d_activities?.sanctioned_self_gp}
                        onChange={(v) => update('d2d_activities.sanctioned_self_gp', v === '' ? '' : Number(v))}
                      />

                      <Input label='GP through CSR'
                        type="number" min={0}
                        value={form.d2d_activities?.sanctioned_csr_ngo}
                        onChange={(v) => update('d2d_activities.sanctioned_csr_ngo', v === '' ? '' : Number(v))}
                      />

                      <Input label='GP through SHG'
                        type="number" min={0}
                        value={form.d2d_activities?.sanctioned_shg}
                        onChange={(v) => update('d2d_activities.sanctioned_shg', v === '' ? '' : Number(v))}
                      />
                      <Input label='Mixed Model'
                        type="number" min={0}
                        value={form.d2d_activities?.sanctioned_mixed_model}
                        onChange={(v) => update('d2d_activities.sanctioned_mixed_model', v === '' ? '' : Number(v))}
                      />

                      <Input label="Total Expenditure Amt. (Rs in Lakhs)"
                        type="number" min={0}
                        value={form.d2d_activities?.total_expenditure}
                        onChange={(v) => update('d2d_activities.total_expenditure', v === '' ? '' : Number(v))}
                      />

                      <Input label="Vehicles Deployed"
                        type="number" min={0}
                        value={form.d2d_activities?.vehicles_deployed}
                        onChange={(v) => update('d2d_activities.vehicles_deployed', v === '' ? '' : Number(v))}
                      />

                      <Input label="Persons Deployed"
                        type="number" min={0}
                        value={form.d2d_activities?.persons_deployed}
                        onChange={(v) => update('d2d_activities.persons_deployed', v === '' ? '' : Number(v))}
                      />

                      <Input label="Households Covered"
                        type="number" min={0}
                        value={form.d2d_activities?.households_covered}
                        onChange={(v) => update('d2d_activities.households_covered', v === '' ? '' : Number(v))}
                      />

                      <Input label="Work Start"
                        type="number" min={0}
                        value={form.d2d_activities?.status_start}
                        onChange={(v) => update('d2d_activities.status_start', v === '' ? '' : Number(v))}
                      />

                      <Input label="Work Running"
                        type="number" min={0}
                        value={form.d2d_activities?.status_running}
                        onChange={(v) => update('d2d_activities.status_running', v === '' ? '' : Number(v))}
                      />

                      <Input label="Work Completed"
                        type="number" min={0}
                        value={form.d2d_activities?.status_completed}
                        onChange={(v) => update('d2d_activities.status_completed', v === '' ? '' : Number(v))}
                      />

                    </div>
                  )}
                </div>
              ))}


              {/* {section('SBMG targets', (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['ihhl', 'csc', 'rrc', 'pwmu', 'soak_pit', 'magic_pit', 'leach_pit', 'wsp', 'dewats'].map((k) => (
                    <Input key={k} label={k.replace(/_/g, ' ')} type="number" min={0} value={form.sbmg_targets?.[k]} onChange={(v) => update(`sbmg_targets.${k}`, v === '' ? '' : Number(v))} disabled={saving} />
                  ))}
                </div>
              ))} */}

              {section('Village data', (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {(form.village_data || []).map((v, i) => (
                    <div key={i} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Village {i + 1}</span>
                        <button type="button" onClick={() => removeVillage(i)} disabled={saving || (form.village_data?.length || 0) <= 1} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#dc2626' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                        <Input label="Village name" value={v.village_name} onChange={(val) => updateVillage(i, 'village_name', val)} disabled={saving} />
                        <Input label="Population" type="number" min={0} value={v.population ?? ''} onChange={(val) => updateVillage(i, 'population', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Number of households" type="number" min={0} value={v.num_households ?? ''} onChange={(val) => updateVillage(i, 'num_households', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="SBMG IHHL" type="number" min={0} value={v.sbmg_assets?.ihhl ?? ''} onChange={(val) => updateVillage(i, 'sbmg_assets.ihhl', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="SBMG CSC" type="number" min={0} value={v.sbmg_assets?.csc ?? ''} onChange={(val) => updateVillage(i, 'sbmg_assets.csc', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Soak pit" type="number" min={0} value={v.gwm_assets?.soak_pit ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.soak_pit', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Magic pit" type="number" min={0} value={v.gwm_assets?.magic_pit ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.magic_pit', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="Leach pit" type="number" min={0} value={v.gwm_assets?.leach_pit ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.leach_pit', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="WSP" type="number" min={0} value={v.gwm_assets?.wsp ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.wsp', val === '' ? '' : Number(val))} disabled={saving} />
                        <Input label="DEWATS" type="number" min={0} value={v.gwm_assets?.dewats ?? ''} onChange={(val) => updateVillage(i, 'gwm_assets.dewats', val === '' ? '' : Number(val))} disabled={saving} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addVillage} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <Plus size={16} /> Add village
                  </button>
                </div>
              ))}
            </>
          )}
        </div>


        {!loading && form && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button onClick={handleOverlayClick} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} style={{ padding: '10px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>


      {/* Agency create module */}
      {moduleAgency && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{

            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}  // 🔥 ALSO HERE
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "12px",
              width: "400px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}
          >
            <h3 style={{ marginBottom: "15px" }}>Create Agency</h3>

            {errorInagency && !loading && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: '13px', marginBottom: '16px' }}>
                {errorInagency}
              </div>
            )}

            <Input
              label="Agency Name"
              value={agencyForm.name}
              onChange={(v) =>
                setAgencyForm((prev) => ({ ...prev, name: v }))
              }
            />

            <Input
              label="Email"
              value={agencyForm.email}
              onChange={(v) =>
                setAgencyForm((prev) => ({ ...prev, email: v }))
              }
            />

            <Input
              label="Contact Number"
              value={agencyForm.contact_number}
              onChange={(v) =>
                setAgencyForm((prev) => ({
                  ...prev,
                  contact_number: v.replace(/[^0-9]/g, "").slice(0, 10)
                }))
              }
            />
            <Input
              label="Address"
              value={agencyForm.address}
              onChange={(v) =>
                setAgencyForm((prev) => ({ ...prev, address: v }))
              }
            />

            <div style={{ marginTop: "15px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => SetModuleAgency(false)}
                style={{
                  padding: "8px 14px",
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>

              <button
                disabled={loading}
                onClick={handleCreateAgency}
                style={{
                  padding: "8px 14px",
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default EditGPMasterModal;
