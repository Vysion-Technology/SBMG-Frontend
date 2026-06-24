import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import endashboard from "./locales/en/dashboard.json";
import encomplaints from "./locales/en/complaints.json";
import entable from "./locales/en/table.json";
import encscCleaning from "./locales/en/cscCleaning.json";
import eninspection from "./locales/en/inspection.json";
import engpmaster from "./locales/en/gpMaster.json";
import enschemeevent from "./locales/en/SchemeEvent.json";
import engps from "./locales/en/gps.json";
import ennoticeFeedback from "./locales/en/noticefeedback.json";
import entooltip from "./locales/en/tooltip.json";


import hiCommon from "./locales/hi/common.json";
import hidashboard from "./locales/hi/dashboard.json";
import hicomplaints from "./locales/hi/complaints.json";
import hitable from "./locales/hi/table.json";
import hicscCleaning from "./locales/hi/cscCleaning.json";
import hiinspection from "./locales/hi/inspection.json";
import higpmaster from "./locales/hi/gpMaster.json";
import hischemeevent from "./locales/hi/SchemeEvent.json";
import higps from "./locales/hi/gps.json";
import hinoticeFeedback from "./locales/hi/noticefeedback.json";
import hitooltip from "./locales/hi/tooltip.json";
import { table } from "framer-motion/client";

i18n

  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enCommon,
        common: enCommon,
        dashboard: endashboard,
        complaints: encomplaints,
        table: entable,
        csc: encscCleaning,
        inspection: eninspection,
        gpmaster: engpmaster,
        schemeevent: enschemeevent,
        gps: engps,
        noFB: ennoticeFeedback,
        tooltip: entooltip,
      },
      hi: {
        translation: hiCommon,
        common: hiCommon,
        dashboard: hidashboard,
        complaints: hicomplaints,
        table: hitable,
        csc: hicscCleaning,
        inspection: hiinspection,
        gpmaster: higpmaster,
        schemeevent: hischemeevent,
        gps: higps,
        noFB: hinoticeFeedback,
        tooltip: hitooltip,
      },
    },


    lng: localStorage.getItem("language") || "en",

    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },

  });


export default i18n;