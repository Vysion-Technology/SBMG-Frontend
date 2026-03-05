const fs = require('fs');

const makeClickable = (content, title, moduleName) => {
  const regex = new RegExp(`(<Card\\s+className=")([^"]+)(")(>\\s*<TopRightHeader title="${title}")`, 'g');
  return content.replace(regex, `$1$2 cursor-pointer transition-shadow hover:shadow-md$3 onClick={() => setActiveItem && setActiveItem('${moduleName}')}$4`);
};
const makeClickableNoHeader = (content, searchStr, moduleName) => {
  return content.replace(
    new RegExp(`(<Card\\s+className=")([^"]+)(")(>\\s*<div.*?<h2.*?>${searchStr})`, 'g'),
    `$1$2 cursor-pointer transition-shadow hover:shadow-md$3 onClick={() => setActiveItem && setActiveItem('${moduleName}')}$4`
  );
};
const makeClickableGPData = (content, title, moduleName) => {
  return content.replace(
    new RegExp(`(<Card\\s+className=")([^"]+)(")(>\\s*<Header title="${title}")`, 'g'),
    `$1$2 cursor-pointer transition-shadow hover:shadow-md$3 onClick={() => setActiveItem && setActiveItem('${moduleName}')}$4`
  );
};

// Attendance
let attendance = fs.readFileSync('src/components/dashboards/DashboardAttendance.jsx', 'utf8');
attendance = attendance.replace(/export default function DashboardAttendance\(\) \{/, 'export default function DashboardAttendance({ setActiveItem }) {');
attendance = makeClickable(attendance, 'Attendance', 'Attendance');
attendance = makeClickable(attendance, 'Inspection', 'Inspection');
attendance = makeClickable(attendance, 'Contractor Details', 'Contractor Details');
attendance = makeClickableNoHeader(attendance, 'Schemes', 'Schemes');
attendance = makeClickableNoHeader(attendance, 'Events', 'Events');
fs.writeFileSync('src/components/dashboards/DashboardAttendance.jsx', attendance);

// GPData
let gpData = fs.readFileSync('src/components/dashboards/DashboardGPData.jsx', 'utf8');
gpData = gpData.replace(/export default function DashboardGPData\(\) \{/, 'export default function DashboardGPData({ setActiveItem }) {');
gpData = makeClickableGPData(gpData, 'GP Master Data', 'GP Master Data');
gpData = makeClickableGPData(gpData, 'GPS Tracking', 'GPS Tracking');
fs.writeFileSync('src/components/dashboards/DashboardGPData.jsx', gpData);

