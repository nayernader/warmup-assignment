const fs = require("fs");

// ============================================================
// Function 1: getShiftDuration(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getShiftDuration(startTime, endTime) {
    // TODO: Implement this function
    const toSeconds = (timeStr) => {
    const [time, period] = timeStr.trim().split(' ');
    let [h, m, s] = time.split(':').map(Number);
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return h * 3600 + m * 60 + s;
  };

  let diff = toSeconds(endTime) - toSeconds(startTime);
  if (diff < 0) diff += 24 * 3600; // handle overnight shifts

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ============================================================
// Function 2: getIdleTime(startTime, endTime)
// startTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// endTime: (typeof string) formatted as hh:mm:ss am or hh:mm:ss pm
// Returns: string formatted as h:mm:ss
// ============================================================
function getIdleTime(startTime, endTime) {
    // TODO: Implement this function
    const toSeconds = (timeStr) => {
    const [time, period] = timeStr.trim().split(' ');
    let [h, m, s] = time.split(':').map(Number);
    if (period === 'pm' && h !== 12) h += 12;
    if (period === 'am' && h === 12) h = 0;
    return h * 3600 + m * 60 + s;
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const DELIVERY_START = 8 * 3600;   // 8:00 AM in seconds
  const DELIVERY_END   = 22 * 3600;  // 10:00 PM in seconds

  const start = toSeconds(startTime);
  const end   = toSeconds(endTime);

  // Idle before delivery hours (before 8 AM)
  const idleBefore = Math.max(0, Math.min(end, DELIVERY_START) - start);

  // Idle after delivery hours (after 10 PM)
  const idleAfter = Math.max(0, end - Math.max(start, DELIVERY_END));

  return formatTime(idleBefore + idleAfter);
}

// ============================================================
// Function 3: getActiveTime(shiftDuration, idleTime)
// shiftDuration: (typeof string) formatted as h:mm:ss
// idleTime: (typeof string) formatted as h:mm:ss
// Returns: string formatted as h:mm:ss
// ============================================================
function getActiveTime(shiftDuration, idleTime) {
    // TODO: Implement this function
    const toSeconds = (timeStr) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  const diff = toSeconds(shiftDuration) - toSeconds(idleTime);

  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;

  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ============================================================
// Function 4: metQuota(date, activeTime)
// date: (typeof string) formatted as yyyy-mm-dd
// activeTime: (typeof string) formatted as h:mm:ss
// Returns: boolean
// ============================================================
function metQuota(date, activeTime) {
    // TODO: Implement this function

   const toSeconds = (timeStr) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  const d = new Date(date);
  const eidStart = new Date('2025-04-10');
  const eidEnd   = new Date('2025-04-30');

  const isEid = d >= eidStart && d <= eidEnd;
  const quota = isEid ? 6 * 3600 : (8 * 3600 + 24 * 60); // 6:00:00 or 8:24:00

  return toSeconds(activeTime) >= quota;


}

// ============================================================
// Function 5: addShiftRecord(textFile, shiftObj)
// textFile: (typeof string) path to shifts text file
// shiftObj: (typeof object) has driverID, driverName, date, startTime, endTime
// Returns: object with 10 properties or empty object {}
// ============================================================
function addShiftRecord(textFile, shiftObj) {
    // TODO: Implement this function
    const { driverID, driverName, date, startTime, endTime } = shiftObj;

  // Read file and split into header + data lines
  const content = fs.existsSync(textFile) ? fs.readFileSync(textFile, 'utf8').trim() : '';
  const allLines = content.split('\n');
  const header = allLines[0];
  const dataLines = allLines.slice(1).filter(l => l.trim());

  // Parse CSV line into object
  const parseLine = (line) => {
    const [driverID, driverName, date, startTime, endTime,
           shiftDuration, idleTime, activeTime, metQuota, hasBonus] = line.split(',');
    return { driverID, driverName, date, startTime, endTime,
             shiftDuration, idleTime, activeTime, metQuota, hasBonus };
  };

  const records = dataLines.map(parseLine);

  // Check for duplicate
  const isDuplicate = records.some(r => r.driverID === driverID && r.date === date);
  if (isDuplicate) return {};

  // Calculate fields using already-implemented functions
  const shiftDuration = getShiftDuration(startTime, endTime);
  const idleTime      = getIdleTime(startTime, endTime);
  const activeTime    = getActiveTime(shiftDuration, idleTime);

  const newRecord = {
    driverID, driverName, date, startTime, endTime,
    shiftDuration, idleTime, activeTime,
    metQuota: metQuota(date, activeTime),
    hasBonus: false
  };

  // Insert after last record of same driverID, or append
  const lastIndex = records.reduce((acc, r, i) => r.driverID === driverID ? i : acc, -1);
  if (lastIndex === -1) {
    records.push(newRecord);
  } else {
    records.splice(lastIndex + 1, 0, newRecord);
  }

  // Write back to file
  const toCSVLine = (r) =>
    `${r.driverID},${r.driverName},${r.date},${r.startTime},${r.endTime},` +
    `${r.shiftDuration},${r.idleTime},${r.activeTime},${r.metQuota},${r.hasBonus}`;

  fs.writeFileSync(textFile, [header, ...records.map(toCSVLine)].join('\n'));

  return newRecord;
}

// ============================================================
// Function 6: setBonus(textFile, driverID, date, newValue)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// date: (typeof string) formatted as yyyy-mm-dd
// newValue: (typeof boolean)
// Returns: nothing (void)
// ============================================================
function setBonus(textFile, driverID, date, newValue) {
    // TODO: Implement this function

     const content = fs.readFileSync(textFile, 'utf8').trim();
  const lines = content.split('\n');

  const updatedLines = lines.map((line, index) => {
    if (index === 0) return line; // skip header
    const cols = line.split(',');
    if (cols[0] === driverID && cols[2] === date) {
      cols[9] = String(newValue); // update hasBonus (last column)
      return cols.join(',');
    }
    return line;
  });

  fs.writeFileSync(textFile, updatedLines.join('\n'));
}

// ============================================================
// Function 7: countBonusPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof string) formatted as mm or m
// Returns: number (-1 if driverID not found)
// ============================================================
function countBonusPerMonth(textFile, driverID, month) {
    // TODO: Implement this function

     const content = fs.readFileSync(textFile, 'utf8').trim();
  const lines = content.split('\n').slice(1).filter(l => l.trim()); // skip header

  const driverRows = lines.filter(line => {
    const cols = line.split(',');
    return cols[0] === driverID;
  });

  // Return -1 if driver not found
  if (driverRows.length === 0) return -1;

  return driverRows.filter(line => {
    const cols = line.split(',');
    const recordMonth = String(parseInt(cols[2].split('-')[1])); // "2025-04-05" → "4"
    const inputMonth  = String(parseInt(month));                 // "04" or "4" → "4"
    return recordMonth === inputMonth && cols[9].trim() === 'true';
  }).length;
}

// ============================================================
// Function 8: getTotalActiveHoursPerMonth(textFile, driverID, month)
// textFile: (typeof string) path to shifts text file
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getTotalActiveHoursPerMonth(textFile, driverID, month) {
    // TODO: Implement this function
     const toSeconds = (timeStr) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };

  const content = fs.readFileSync(textFile, 'utf8').trim();
  const lines = content.split('\n').slice(1).filter(l => l.trim());

  let totalSeconds = 0;

  lines.forEach(line => {
    const cols = line.split(',');
    const recordMonth = parseInt(cols[2].split('-')[1]); // "2025-04-05" → 4
    if (cols[0] === driverID && recordMonth === month) {
      totalSeconds += toSeconds(cols[7].trim()); // col 7 = activeTime
    }
  });

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(3, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

}


// ============================================================
// Function 9: getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month)
// textFile: (typeof string) path to shifts text file
// rateFile: (typeof string) path to driver rates text file
// bonusCount: (typeof number) total bonuses for given driver per month
// driverID: (typeof string)
// month: (typeof number)
// Returns: string formatted as hhh:mm:ss
// ============================================================
function getRequiredHoursPerMonth(textFile, rateFile, bonusCount, driverID, month) {
    // TODO: Implement this function
    const rateLines = fs.readFileSync(rateFile, 'utf8').trim().split('\n').slice(1);
  const driverRate = rateLines.find(line => line.split(',')[0] === driverID);
  const dayOff = driverRate.split(',')[1].trim(); // e.g. "Friday"

  const lines = fs.readFileSync(textFile, 'utf8').trim().split('\n').slice(1).filter(l => l.trim());

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const EID_START = new Date('2025-04-10');
  const EID_END   = new Date('2025-04-30');

  let totalSeconds = 0;

  lines.forEach(line => {
    const cols = line.split(',');
    if (cols[0] !== driverID) return;                          // wrong driver

    const date = cols[2].trim();
    if (parseInt(date.split('-')[1]) !== month) return;        // wrong month

    const dayOfWeek = DAYS[new Date(date).getDay()];
    if (dayOfWeek === dayOff) return;                          // skip day off

    const d = new Date(date);
    const isEid = d >= EID_START && d <= EID_END;
    totalSeconds += isEid ? 6 * 3600 : (8 * 3600 + 24 * 60); // 6h or 8h24m
  });

  totalSeconds -= bonusCount * 2 * 3600; // subtract 2h per bonus

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(3, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ============================================================
// Function 10: getNetPay(driverID, actualHours, requiredHours, rateFile)
// driverID: (typeof string)
// actualHours: (typeof string) formatted as hhh:mm:ss
// requiredHours: (typeof string) formatted as hhh:mm:ss
// rateFile: (typeof string) path to driver rates text file
// Returns: integer (net pay)
// ============================================================
function getNetPay(driverID, actualHours, requiredHours, rateFile) {
    // TODO: Implement this function

    
}

module.exports = {
    getShiftDuration,
    getIdleTime,
    getActiveTime,
    metQuota,
    addShiftRecord,
    setBonus,
    countBonusPerMonth,
    getTotalActiveHoursPerMonth,
    getRequiredHoursPerMonth,
    getNetPay
};
