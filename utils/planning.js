export function getScheduleQueryParamsAsString(ASchedule) {
  let Result = '';
  if (ASchedule) {
    ASchedule.forEach(sd => {
      Result += Result=='' ? '' : '&';
      Result += 'h'+sd.startHour+'='+sd.station;
    });
  }
  return Result;
}