export function getScheduleQueryParamsAsString(schedule) {
  let result = '';
  if (schedule) {
    schedule.forEach((sd) => {
      result += result == '' ? '' : '&';
      result += `h${sd.startHour}=${sd.station}`;
    });
  }
  return result;
}
